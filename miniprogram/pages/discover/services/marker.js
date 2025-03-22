// 标记点处理模块
const MarkerService = {
  processMarkers(users) {
    if (!users || !Array.isArray(users)) return [];
    
    const markers = users.map((user, index) => {
      // 确保用户数据存在
      if (!user) {
        console.warn('用户数据不存在');
        return null;
      }
      
      // 检查位置数据
      if (!user.location) {
        console.warn('用户位置数据缺失', user._id || '未知ID');
        return null;
      }
      
      let lat, lng;
      
      // 优先使用直接的latitude/longitude格式（微信小程序地图默认格式）
      if (user.location.latitude !== undefined && user.location.longitude !== undefined) {
        if (typeof user.location.latitude === 'number' && typeof user.location.longitude === 'number') {
          lat = user.location.latitude;
          lng = user.location.longitude;
        } else {
          console.warn('用户位置数据类型错误，经纬度应为数字', user._id || '未知ID');
          return null;
        }
      }
      // 兼容GeoJSON格式 { type: "Point", coordinates: [lng, lat] }
      else if (user.location.coordinates && Array.isArray(user.location.coordinates) && 
               user.location.coordinates.length === 2) {
        if (typeof user.location.coordinates[0] === 'number' && 
            typeof user.location.coordinates[1] === 'number') {
          lng = user.location.coordinates[0];
          lat = user.location.coordinates[1];
        } else {
          console.warn('GeoJSON坐标数据类型错误，经纬度应为数字', user._id || '未知ID');
          return null;
        }
      }
      // 支持数组格式 [lng, lat]
      else if (Array.isArray(user.location) && user.location.length === 2) {
        if (typeof user.location[0] === 'number' && typeof user.location[1] === 'number') {
          lng = user.location[0];
          lat = user.location[1];
        } else {
          console.warn('坐标数组数据类型错误，经纬度应为数字', user._id || '未知ID');
          return null;
        }
      }
      // 位置格式不支持
      else {
        console.warn('不支持的位置数据格式', user._id || '未知ID', user.location);
        return null;
      }
      
      // 优先使用本地处理的圆形头像，这个路径已经是圆形图片
      const iconPath = user.circleAvatarPath || user.avatarUrl || '/images/avatar.png';
      console.log(`标记点 ${index} 使用头像:`, iconPath);
      
      // 创建地图标记点
      return {
        id: index,
        latitude: lat,
        longitude: lng,
        width: 40, // 标记点大小
        height: 40, // 标记点大小
        iconPath: iconPath,
        // 确保标记点居中显示
        anchor: {
          x: 0.5,
          y: 0.5
        },
        callout: {
          content: user.nickName || '未知用户',
          padding: 8,
          borderRadius: 4,
          display: 'BYCLICK'
        },
        // 用户数据分类便于过滤
        type: user.type || 'user',
        // 只保留基本用户信息
        userData: {
          id: user._id,
          openid: user._openid,
          nickName: user.nickName || '未知用户',
          avatarUrl: user.avatarUrl || '/images/avatar.png',
          gender: user.gender || 0,
          location: user.location,
          introduction: user.introduction || '这个用户很懒，什么都没留下',
          tags: user.tags || [],
          visible: user.visible !== false
        }
      };
    }).filter(marker => marker !== null); // 过滤掉无效的标记点
    
    console.log(`生成了 ${markers.length} 个标记点`);
    return markers;
  },

  filterMarkers(markers, filter, keyword = '') {
    if (!markers || !Array.isArray(markers)) return [];
    
    let filtered = [...markers];
    
    // 按类型过滤（确保有类型属性）
    if (filter && filter !== 'all') {
      filtered = filtered.filter(marker => 
        (marker.type && marker.type === filter) || 
        (marker.userData && marker.userData.type === filter)
      );
    }
    
    // 按关键词过滤
    if (keyword && keyword.trim() !== '') {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(marker => {
        if (!marker.userData) return false;
        
        // 在昵称中搜索
        const nickNameMatch = marker.userData.nickName && 
          marker.userData.nickName.toLowerCase().includes(lowerKeyword);
        
        return nickNameMatch;
      });
    }
    
    return filtered;
  },

  /**
   * 将用户数据转换为地图标记点
   * @param {Array} users - 用户数据数组
   * @returns {Array} - 标记点数组
   */
  createMarkers(users = []) {
    console.log('创建标记点, 用户数据:', users);
    if (!users.length) return [];

    return users.map((user, index) => {
      // 检查是否有位置信息
      if (!user.location || !Array.isArray(user.location) || user.location.length !== 2) {
        console.log(`用户 ${user._openid || index} 缺少位置信息:`, user.location);
        return null;
      }

      // 优先使用圆形头像，统一使用circleAvatarPath属性
      const iconPath = user.circleAvatarPath || user.avatarUrl || '/images/avatar.png';
      // 增强日志记录
      console.log(`用户 ${user._openid || index} 最终使用的头像:`, {
        用户ID: user._openid,
        昵称: user.nickName,
        原始头像: user.avatarUrl,
        圆形头像: user.circleAvatarPath,
        最终路径: iconPath,
        是否是默认头像: iconPath === '/images/avatar.png'
      });

      return {
        id: user._openid || index,
        latitude: user.location[1],
        longitude: user.location[0],
        width: 36,  // 稍微增大一点
        height: 36, // 稍微增大一点
        callout: {
          content: user.nickName || '用户',
          padding: 5,
          borderRadius: 5,
          display: 'ALWAYS'
        },
        iconPath,
        // 添加圆形样式
        borderRadius: 18,  // 宽高的一半
        borderWidth: 2,
        borderColor: '#ffffff'
      };
    }).filter(marker => marker !== null);
  }
};

module.exports = MarkerService; 