/**
 * 地图用户头像处理服务
 * 负责处理地图标记需要的圆形头像
 */

// 是否启用详细日志（可根据需要手动修改）
const ENABLE_DEBUG_LOG = false;

// 缓存配置
const CACHE_CONFIG = {
  MAX_SIZE: 200,         // 最大缓存数量
  EXPIRY_TIME: 1800000,  // 缓存有效期(30分钟)
  CLEANUP_INTERVAL: 300000, // 清理间隔(5分钟)
  HIGH_QUALITY_SIZE: 100, // 超过此尺寸使用高品质模式
  FILE_BATCH_SIZE: 10    // 批量删除文件的大小
};

// 文件系统管理器
const fs = wx.getFileSystemManager();

// 临时文件缓存
const avatarCache = {
  // 存储结构：{ 缓存键: {path, createTime, lastAccess} }
  cache: {},
  // 上次清理时间
  lastCleanTime: Date.now()
};

/**
 * 日志打印函数
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {any} data - 附加数据
 */
const log = (level, message, data) => {
  // 非调试模式下仅打印错误、警告和性能日志
  if (!ENABLE_DEBUG_LOG && !['error', 'warn', 'perf'].includes(level)) return;
  
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  
  switch(level) {
    case 'error':
      console.error(`[${timestamp}] [ERROR] ${message}`, data || '');
      break;
    case 'warn':
      console.warn(`[${timestamp}] [WARN] ${message}`, data || '');
      break;
    case 'info':
      console.log(`[${timestamp}] [INFO] ${message}`, data || '');
      break;
    case 'perf':
      console.log(`[${timestamp}] [PERF] ${message}`, data || '');
      break;
    default:
      console.log(`[${timestamp}] [DEBUG] ${message}`, data || '');
  }
};

/**
 * 生成缓存键
 * @param {string} imageUrl - 图片URL
 * @param {number} size - 尺寸
 * @param {string} userId - 用户ID
 * @returns {string} 缓存键
 */
const generateCacheKey = (imageUrl, size, userId) => {
  return userId ? `${userId}_${imageUrl}_${size}` : `${imageUrl}_${size}`;
};

/**
 * 生成临时文件名
 * @param {string} userId - 用户ID
 * @returns {string} 文件名(不含路径和扩展名)
 */
const generateTempFileName = (userId) => {
  return userId 
    ? `avatar_${userId}_${Date.now()}`
    : `avatar_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

/**
 * 获取图片信息
 * @param {string} imageUrl - 图片URL或路径
 * @param {string} userId - 用户ID(用于日志)
 * @returns {Promise<object>} 图片信息
 */
const getImageInfo = async (imageUrl, userId = '') => {
  try {
    log('debug', '开始处理图片:', `${imageUrl.slice(0, 30)}... 用户ID:${userId}`);
    
    // 判断图片URL类型，优化不同来源图片获取
    if (imageUrl.startsWith('http') || imageUrl.startsWith('cloud://')) {
      // 网络图片
      log('debug', '下载远程图片');
      const imgInfo = await wx.getImageInfo({ src: imageUrl });
      log('debug', '下载成功', `尺寸: ${imgInfo.width}x${imgInfo.height}`);
      return imgInfo;
    } else if (imageUrl.startsWith('wxfile://')) {
      // 处理特殊的微信临时文件路径
      const imgInfo = await wx.getImageInfo({ src: imageUrl });
      log('debug', '获取微信临时文件成功');
      return imgInfo;
    } else {
      // 常规本地图片
      const imgInfo = await wx.getImageInfo({ src: imageUrl });
      log('debug', '获取本地图片成功');
      return imgInfo;
    }
  } catch (error) {
    log('error', '获取图片信息失败:', { error, userId });
    throw error;
  }
};

/**
 * 从缓存获取头像
 * @param {string} cacheKey - 缓存键
 * @param {string} userId - 用户ID(用于日志)
 * @returns {string|null} 成功返回缓存路径，失败返回null
 */
const getFromCache = (cacheKey, userId = '') => {
  if (!avatarCache.cache[cacheKey]) {
    return null;
  }
  
  const cacheItem = avatarCache.cache[cacheKey];
  
  // 验证文件是否存在
  try {
    const fs = wx.getFileSystemManager();
    fs.accessSync(cacheItem.path);
    log('debug', '使用缓存的圆形头像:', cacheItem.path, '用户ID:', userId);
    
    // 更新访问时间
    cacheItem.lastAccess = Date.now();
    return cacheItem.path;
  } catch (e) {
    // 文件不存在，从缓存中移除
    log('debug', '缓存的文件不存在，重新生成:', e);
    delete avatarCache.cache[cacheKey];
    return null;
  }
};

/**
 * 计算图像裁剪参数
 * @param {object} imgInfo - 图片信息
 * @returns {object} 裁剪参数
 */
const calculateCropParams = (imgInfo) => {
  const imgWidth = imgInfo.width;
  const imgHeight = imgInfo.height;
  const minDimension = Math.min(imgWidth, imgHeight);
  
  // 计算裁剪起点，确保从中心开始
  const srcX = (imgWidth - minDimension) / 2;
  const srcY = (imgHeight - minDimension) / 2;
  
  return { srcX, srcY, minDimension };
};

/**
 * 使用离屏Canvas绘制圆形头像
 * @param {string} imgPath - 图片路径
 * @param {number} size - 头像尺寸
 * @param {boolean} useHighQuality - 是否使用高质量模式
 * @returns {Promise<string>} 临时文件的Base64数据
 */
const drawCircleAvatarOffscreen = async (imgPath, size, useHighQuality = false) => {
  // 获取图片信息
  const imgInfo = await wx.getImageInfo({ src: imgPath });
  const { srcX, srcY, minDimension } = calculateCropParams(imgInfo);

  // 画布尺寸，使用2倍尺寸可提高清晰度，降低锯齿
  const canvasSize = useHighQuality ? size * 2 : size;
  
  // 创建离屏Canvas
  const offscreenCanvas = wx.createOffscreenCanvas({ 
    type: '2d', 
    width: canvasSize, 
    height: canvasSize 
  });
  const ctx = offscreenCanvas.getContext('2d');
  
  // 清空画布并设置平滑选项
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = useHighQuality ? 'high' : 'medium';
  
  // 创建圆形剪裁区域 - 使用路径优化
  ctx.beginPath();
  ctx.arc(canvasSize/2, canvasSize/2, canvasSize/2, 0, 2 * Math.PI);
  ctx.clip();
  
  // 预加载图像到内存
  const image = offscreenCanvas.createImage();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imgPath;
  });
  
  // 绘制图像，确保从中心裁剪并填充整个圆形区域
  ctx.drawImage(
    image, 
    srcX, srcY, minDimension, minDimension, // 源图像裁剪参数
    0, 0, canvasSize, canvasSize // 目标区域参数
  );
  
  // 绘制白色边框
  ctx.beginPath();
  ctx.arc(canvasSize/2, canvasSize/2, canvasSize/2 - (useHighQuality ? 2 : 1), 0, 2 * Math.PI);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = useHighQuality ? 3 : 2;
  ctx.stroke();
  
  // 将离屏Canvas内容导出为图片，调整压缩品质
  return offscreenCanvas.toDataURL('image/png', useHighQuality ? 0.95 : 0.85);
};

/**
 * 保存图像到临时文件
 * @param {string} base64Data - Base64编码的图像数据
 * @param {string} filePath - 目标文件路径
 */
const saveToTempFile = (base64Data, filePath) => {
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const fs = wx.getFileSystemManager();
  
  // 写入临时文件
  fs.writeFileSync(
    filePath,
    cleanBase64,
    'base64'
  );
};

/**
 * 添加到缓存
 * @param {string} cacheKey - 缓存键
 * @param {string} filePath - 文件路径
 */
const addToCache = (cacheKey, filePath) => {
  avatarCache.cache[cacheKey] = {
    path: filePath,
    createTime: Date.now(),
    lastAccess: Date.now()
  };
};

/**
 * 创建圆形头像
 * @param {string} imageUrl - 原始图片URL/路径
 * @param {number} size - 头像尺寸
 * @param {string} userId - 用户ID，用于生成唯一的缓存键
 * @param {Object} options - 额外选项
 * @param {boolean} options.forceRefresh - 是否强制刷新，忽略缓存
 * @param {boolean} options.forceHighQuality - 是否强制使用高质量模式
 * @returns {Promise<string>} 圆形头像的本地临时路径
 */
const createCircleAvatar = async (imageUrl, size = 60, userId = '', options = {}) => {
  const startTime = Date.now();
  const { forceRefresh = false, forceHighQuality = false } = options;
  
  try {
    if (!imageUrl) {
      return '/images/avatar.png'; // 默认头像
    }
    
    // 使用高质量模式的条件：强制高质量或尺寸大于阈值
    const useHighQuality = forceHighQuality || size >= CACHE_CONFIG.HIGH_QUALITY_SIZE;
    
    // 使用用户ID生成唯一的缓存键，加入高质量标记
    const qualityMark = useHighQuality ? 'hq' : 'lq';
    const cacheKey = generateCacheKey(`${imageUrl}_${qualityMark}`, size, userId);
    
    // 检查缓存(除非强制刷新)
    if (!forceRefresh) {
      const cachedPath = getFromCache(cacheKey, userId);
      if (cachedPath) {
        // 记录性能数据
        const endTime = Date.now();
        log('perf', `从缓存获取头像耗时: ${endTime - startTime}ms`, userId ? `用户ID: ${userId}` : '');
        return cachedPath;
      }
    }
    
    // 每10次创建检查一次缓存
    if (Math.random() < 0.1) {
      // 异步清理缓存，不阻塞当前处理
      setTimeout(() => cleanupAvatarCache(), 0);
    }
    
    // 获取原始图片信息
    let imgInfo;
    try {
      imgInfo = await getImageInfo(imageUrl, userId);
    } catch (error) {
      log('error', '获取图片信息失败:', error, '用户ID:', userId);
      return '/images/avatar.png'; // 出错时使用默认头像
    }
    
    // 创建唯一文件名避免冲突
    const fileName = generateTempFileName(userId);
    const tempFilePath = `${wx.env.USER_DATA_PATH}/${fileName}.png`;
    
    // 使用离屏Canvas绘制圆形头像
    try {
      const tempImg = await drawCircleAvatarOffscreen(imgInfo.path, size, useHighQuality);
      
      // 保存到临时文件
      saveToTempFile(tempImg, tempFilePath);
      
      // 更新缓存
      addToCache(cacheKey, tempFilePath);
      
      // 记录性能数据
      const endTime = Date.now();
      log('perf', `创建圆形头像总耗时: ${endTime - startTime}ms`, userId ? `用户ID: ${userId}` : '');
      
      return tempFilePath;
    } catch (error) {
      log('error', '创建圆形头像失败:', error, '用户ID:', userId);
      
      // 如果离屏Canvas方法失败，回退到传统方式
      return fallbackCreateCircleAvatar(imgInfo.path, size, userId);
    }
  } catch (error) {
    log('error', '处理圆形头像异常:', error, '用户ID:', userId);
    const endTime = Date.now();
    log('perf', `创建圆形头像失败，耗时: ${endTime - startTime}ms`);
    return '/images/avatar.png';
  }
};

/**
 * 传统方式创建圆形头像（作为备用方法）
 */
const fallbackCreateCircleAvatar = (imgPath, size, userId) => {
  return new Promise((resolve, reject) => {
    try {
      // 创建唯一Canvas ID
      const canvasId = `avatarCanvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 创建临时Canvas组件
      const query = wx.createSelectorQuery();
      const canvas = query.select('#' + canvasId);
      
      if (!canvas) {
        log('error', '未找到Canvas组件', canvasId);
        resolve('/images/avatar.png');
        return;
      }
      
      const ctx = wx.createCanvasContext(canvasId);
      
      // 清空画布
      ctx.clearRect(0, 0, size, size);
      
      // 绘制圆形
      ctx.save();
      ctx.beginPath();
      // 创建圆形剪裁区域
      ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
      ctx.clip();
      
      // 绘制图像
      ctx.drawImage(imgPath, 0, 0, size, size);
      ctx.restore();
      
      // 绘制白色边框
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
      ctx.setStrokeStyle('#ffffff');
      ctx.setLineWidth(2);
      ctx.stroke();
      
      // 导出为图片
      ctx.draw(false, () => {
        // 延迟确保绘制完成
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId: canvasId,
            success: (res) => {
              resolve(res.tempFilePath);
            },
            fail: (err) => {
              log('error', '创建圆形头像失败:', err);
              resolve('/images/avatar.png');
            }
          });
        }, 500);
      });
    } catch (error) {
      log('error', 'fallback方法创建圆形头像失败:', error);
      resolve('/images/avatar.png');
    }
  });
};

/**
 * 批量删除文件
 * @param {Array} filePaths - 文件路径数组
 * @returns {Object} 删除结果 {success, failed}
 */
const batchDeleteFiles = (filePaths) => {
  if (!filePaths || filePaths.length === 0) return { success: 0, failed: 0 };
  
  let success = 0;
  let failed = 0;
  
  // 批量处理，减少单次IO操作
  for (let i = 0; i < filePaths.length; i += CACHE_CONFIG.FILE_BATCH_SIZE) {
    const batch = filePaths.slice(i, i + CACHE_CONFIG.FILE_BATCH_SIZE);
    
    batch.forEach(path => {
      try {
        fs.unlinkSync(path);
        success++;
      } catch (e) {
        failed++;
        if (ENABLE_DEBUG_LOG) log('warn', '删除文件失败:', { path, error: e });
      }
    });
  }
  
  return { success, failed };
};

/**
 * 移除过期缓存项
 * @returns {number} 移除的缓存项数量
 */
const removeExpiredCache = () => {
  try {
    const now = Date.now();
    
    // 过滤出过期缓存项
    const cacheKeys = Object.keys(avatarCache.cache);
    const expired = cacheKeys.filter(key => {
      const item = avatarCache.cache[key];
      return now - item.lastAccess > CACHE_CONFIG.EXPIRY_TIME;
    });
    
    if (expired.length === 0) return 0;
    
    // 批量删除文件
    const filesToDelete = expired.map(key => avatarCache.cache[key].path);
    const { success, failed } = batchDeleteFiles(filesToDelete);
    
    // 从缓存对象中删除
    expired.forEach(key => delete avatarCache.cache[key]);
    
    if (failed > 0) {
      log('warn', `删除过期缓存存在失败: 成功${success}个, 失败${failed}个`);
    }
    
    return success;
  } catch (error) {
    log('error', '移除过期缓存失败:', error);
    return 0;
  }
};

/**
 * 移除最久未访问的缓存项
 * @param {number} targetCount - 目标移除数量
 * @returns {number} 实际移除数量
 */
const removeLeastRecentlyUsed = (targetCount) => {
  try {
    if (targetCount <= 0) return 0;
    
    const remainingKeys = Object.keys(avatarCache.cache);
    // 按最后访问时间排序
    remainingKeys.sort((a, b) => 
      avatarCache.cache[a].lastAccess - avatarCache.cache[b].lastAccess
    );
    
    // 取出需要删除的键
    const toDelete = remainingKeys.slice(0, targetCount);
    if (toDelete.length === 0) return 0;
    
    // 批量删除文件
    const filesToDelete = toDelete.map(key => avatarCache.cache[key].path);
    const { success, failed } = batchDeleteFiles(filesToDelete);
    
    // 从缓存中移除
    toDelete.forEach(key => delete avatarCache.cache[key]);
    
    if (failed > 0) {
      log('warn', `删除LRU缓存存在失败: 成功${success}个, 失败${failed}个`);
    }
    
    return success;
  } catch (error) {
    log('error', '移除LRU缓存失败:', error);
    return 0;
  }
};

/**
 * 清理过期的头像缓存
 */
const cleanupAvatarCache = () => {
  try {
    const now = Date.now();
    
    // 每5分钟最多执行一次清理操作
    if (now - avatarCache.lastCleanTime < CACHE_CONFIG.CLEANUP_INTERVAL) {
      return;
    }
    
    log('info', '开始清理头像缓存...');
    avatarCache.lastCleanTime = now;
    
    // 检查缓存大小是否超出限制
    const cacheKeys = Object.keys(avatarCache.cache);
    if (cacheKeys.length <= CACHE_CONFIG.MAX_SIZE) {
      return;
    }
    
    // 移除过期项
    const expiredCount = removeExpiredCache();
    log('info', `清理完成，删除了 ${expiredCount} 个过期缓存`);
    
    // 如果仍超出限制，删除最久未访问的项
    if (Object.keys(avatarCache.cache).length > CACHE_CONFIG.MAX_SIZE) {
      const excess = Object.keys(avatarCache.cache).length - CACHE_CONFIG.MAX_SIZE;
      const deleteCount = removeLeastRecentlyUsed(excess);
      log('info', `进一步清理完成，删除了 ${deleteCount} 个最久未访问的缓存`);
    }
  } catch (error) {
    log('error', '清理缓存失败:', error);
  }
};

/**
 * 清空所有头像缓存
 */
const clearAllAvatarCache = () => {
  try {
    // 批量删除所有缓存文件
    const filePaths = Object.values(avatarCache.cache).map(item => item.path);
    const { success, failed } = batchDeleteFiles(filePaths);
    
    // 清空缓存对象
    avatarCache.cache = {};
    
    log('info', `所有头像缓存已清空: 成功${success}个, 失败${failed}个`);
    return { success, failed };
  } catch (error) {
    log('error', '清空所有缓存失败:', error);
    return { success: 0, failed: 0 };
  }
};

/**
 * 处理单个用户的头像
 * @param {object} user - 用户数据
 * @param {number} index - 用户索引(用于无ID用户)
 * @returns {Promise<object>} 处理后的用户数据
 */
const processUserAvatar = async (user, index) => {
  // 检查用户是否有头像
  if (!user || !user.avatarUrl) {
    log('info', `用户 ${index} 没有头像，跳过处理`);
    return user;
  }
  
  try {
    const userId = user._openid || `user_${index}`;
    log('info', `处理用户 ${userId} 的头像`);
    
    // 使用工具处理为圆形头像，设置合适的尺寸，传递用户ID确保唯一性
    const circleAvatarPath = await createCircleAvatar(user.avatarUrl, 80, userId);
    
    // 创建新的用户对象，而不是修改原用户
    const processedUser = {
      ...user,
      // 使用处理后的圆形头像
      circleAvatarPath: circleAvatarPath
    };
    
    log('info', `用户 ${userId} 的头像处理完成:`, circleAvatarPath);
    return processedUser;
  } catch (error) {
    log('error', `处理用户 ${user._openid || index} 的头像失败:`, error);
    return user; // 保留原用户数据
  }
};

/**
 * 处理用户数组中所有用户的头像为圆形
 * @param {Array} users - 用户数据数组
 * @param {Object} options - 配置选项
 * @param {number} options.batchSize - 每批处理的用户数，默认3
 * @param {number} options.batchDelay - 批次间延迟(ms)，默认200ms
 * @returns {Promise<Array>} - 处理后的用户数据数组
 */
const processUsersAvatars = async (users, options = {}) => {
  try {
    const { 
      batchSize = 3,     // 每批处理3个用户，避免同时处理太多造成卡顿
      batchDelay = 200   // 批次间延迟200ms，降低持续高负载
    } = options;
    
    log('info', '开始处理用户头像，总数:', users.length);
    
    // 创建用户索引数组
    const userIndices = Array.from({ length: users.length }, (_, i) => i);
    const results = new Array(users.length);
    
    // 分批处理
    for (let i = 0; i < userIndices.length; i += batchSize) {
      const batchIndices = userIndices.slice(i, i + batchSize);
      
      // 并发处理当前批次
      const batchPromises = batchIndices.map(index => 
        processUserAvatar(users[index], index)
          .then(processedUser => {
            results[index] = processedUser;
          })
      );
      
      // 等待当前批次完成
      await Promise.all(batchPromises);
      
      // 非最后一批，添加延迟，避免持续高负载
      if (i + batchSize < userIndices.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
      
      log('info', `完成批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(userIndices.length/batchSize)}`);
    }
    
    // 过滤掉可能的空值
    const processedUsers = results.filter(user => user !== undefined);
    
    log('info', '所有头像处理完成，数量:', processedUsers.length);
    return processedUsers;
  } catch (error) {
    log('error', '批量处理头像失败:', error);
    return users; // 出错时返回原始用户数据
  }
};

module.exports = {
  processUsersAvatars,
  createCircleAvatar,
  cleanupAvatarCache,
  clearAllAvatarCache
}; 