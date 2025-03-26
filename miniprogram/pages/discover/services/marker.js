// 标记点处理模块
const MarkerService = {
  /**
   * 处理用户数据生成地图标记点
   * @param {Array} users - 用户数据数组 
   * @returns {Array} 标记点数组
   */
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
      
      // 统一位置数据格式处理：支持多种位置格式
      // 1. 微信小程序格式: { latitude, longitude }
      if (user.location.latitude !== undefined && user.location.longitude !== undefined) {
        if (typeof user.location.latitude === 'number' && typeof user.location.longitude === 'number') {
          lat = user.location.latitude;
          lng = user.location.longitude;
        } else {
          console.warn('用户位置数据类型错误，经纬度应为数字', user._id || '未知ID');
          return null;
        }
      }
      // 2. GeoJSON格式: { type: "Point", coordinates: [lng, lat] }
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
      // 3. 数组格式: [lng, lat]
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
      
      // 使用本地处理的圆形头像路径
      const iconPath = user.circleAvatarPath || user.avatarUrl || '/images/avatar.png';
      
      // 创建标准化的位置数据对象
      const standardLocation = {
        latitude: lat,
        longitude: lng
      };
      
      // 获取用户唯一标识，确保在数据库中可查询
      const userId = user._openid || user._id || `user_${index}`;
      
      // ===关键修改===：使用索引作为id，确保是纯数字ID
      // 微信地图组件要求marker的id必须是数字类型
      const markerId = index;
      
      // 创建地图标记点
      return {
        id: markerId, // 使用纯数字ID
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
          openid: user._openid || userId, // 确保存在openid
          nickName: user.nickName || '未知用户',
          avatarUrl: user.avatarUrl || '/images/avatar.png',
          gender: user.gender || 0,
          // 统一使用标准格式的位置数据
          location: standardLocation,
          introduction: user.introduction || '这个用户很懒，什么都没留下',
          tags: user.tags || [],
          visible: user.visible !== false,
          // 存储数字id，便于映射回查询
          markerId: markerId
        }
      };
    }).filter(marker => marker !== null); // 过滤掉无效的标记点
    
    console.log(`生成了 ${markers.length} 个标记点，第一个标记点ID:`, markers.length > 0 ? markers[0].id : '无');
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
  }
};

module.exports = MarkerService; 