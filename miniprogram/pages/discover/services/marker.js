// 标记点处理模块
const MarkerService = {
  processMarkers(users) {
    if (!users || !Array.isArray(users)) return [];
    
    return users.map((user, index) => {
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
      // 位置格式不支持
      else {
        console.warn('不支持的位置数据格式', user._id || '未知ID', user.location);
        return null;
      }
      
      // 创建地图标记点
      return {
        id: index,
        latitude: lat,
        longitude: lng,
        width: 32,
        height: 32,
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
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          location: user.location,
          visible: user.visible
        }
      };
    }).filter(marker => marker !== null); // 过滤掉无效的标记点
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
  }
};

module.exports = MarkerService; 