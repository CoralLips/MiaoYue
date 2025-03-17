// 统一的请求处理工具
const CACHE_PREFIX = 'cache_';
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5分钟缓存

const cache = {
  set(key, data, expire = DEFAULT_CACHE_TIME) {
    wx.setStorageSync(CACHE_PREFIX + key, {
      data,
      expire: Date.now() + expire
    });
  },
  get(key) {
    const cached = wx.getStorageSync(CACHE_PREFIX + key);
    if (!cached) return null;
    if (Date.now() > cached.expire) {
      wx.removeStorageSync(CACHE_PREFIX + key);
      return null;
    }
    return cached.data;
  },
  remove(key) {
    wx.removeStorageSync(CACHE_PREFIX + key);
  }
};

const request = (options) => {
  const { url, data, method = 'GET', useCache = false, cacheTime } = options;

  // 如果启用缓存且是GET请求，先尝试从缓存获取
  if (useCache && method === 'GET') {
    const cached = cache.get(url + JSON.stringify(data));
    if (cached) return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 如果启用缓存且是GET请求，将结果存入缓存
          if (useCache && method === 'GET') {
            cache.set(url + JSON.stringify(data), res.data, cacheTime);
          }
          resolve(res.data);
        } else {
          reject(new Error(`请求失败：${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

module.exports = {
  request,
  cache
}; 