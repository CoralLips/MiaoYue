// 用户数据处理模块
const LocationService = require('./location');
const { CACHE_DURATION } = require('../../../utils/constants');

const UserService = {
  async fetchUsersInRegion(southwest, northeast, regionCache) {
    // 检查缓存
    const now = Date.now();
    if (regionCache.data && 
        (now - regionCache.timestamp < CACHE_DURATION.MAP_USERS) && 
        LocationService.isInSameRegion(regionCache.region, {southwest, northeast})) {
      return {
        data: regionCache.data,
        fromCache: true
      };
    }
    
    // 参数验证
    if (!southwest || !northeast || 
        !southwest.latitude || !southwest.longitude || 
        !northeast.latitude || !northeast.longitude) {
      console.error('区域参数无效', { southwest, northeast });
      return { 
        data: [], 
        fromCache: false,
        timestamp: now,
        region: {southwest, northeast}
      };
    }
    
    // 从云数据库获取数据
    try {
      const db = wx.cloud.database();
      const _ = db.command;
      
      // 优先查询标准格式位置数据
      let query = {
        latitude: _.gte(southwest.latitude).and(_.lte(northeast.latitude)),
        longitude: _.gte(southwest.longitude).and(_.lte(northeast.longitude))
      };
      
      console.log('查询区域用户:', query);
      const res = await db.collection('users').where(query).get();
      
      // 如果没有结果，尝试查询GeoJSON格式
      if (res.data.length === 0) {
        console.log('未找到标准格式位置数据，尝试GeoJSON格式...');
        const geoQuery = {
          'location.coordinates.0': _.gte(southwest.longitude).and(_.lte(northeast.longitude)),
          'location.coordinates.1': _.gte(southwest.latitude).and(_.lte(northeast.latitude))
        };
        
        const geoRes = await db.collection('users').where(geoQuery).get();
        
        // 合并结果
        Array.prototype.push.apply(res.data, geoRes.data);
      }
      
      // 补充用户信息，确保存在必要字段，并统一位置格式
      const processedData = res.data.map(user => {
        // 确保必要字段存在
        if (!user._openid) user._openid = user._id;
        if (!user.nickName) user.nickName = '未知用户';
        if (!user.avatarUrl) user.avatarUrl = '/images/avatar.png';
        
        // 标准化位置数据格式
        if (!user.latitude || !user.longitude) {
          // 从GeoJSON格式转换
          if (user.location && user.location.coordinates) {
            user.longitude = user.location.coordinates[0];
            user.latitude = user.location.coordinates[1];
          }
          // 从数组格式转换
          else if (Array.isArray(user.location) && user.location.length === 2) {
            user.longitude = user.location[0];
            user.latitude = user.location[1];
          }
        }
        
        // 确保存在标准位置对象
        user.location = {
          latitude: user.latitude,
          longitude: user.longitude
        };
        
        return user;
      });
      
      return {
        data: processedData,
        fromCache: false,
        timestamp: now,
        region: {southwest, northeast}
      };
    } catch (error) {
      console.error('获取区域用户失败', error);
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      });
      return { 
        data: [], 
        fromCache: false,
        timestamp: now,
        region: {southwest, northeast}
      };
    }
  },
  
  async checkUserInfo() {
    const app = getApp();
    if (!app.globalData.openid) {
      console.log('未登录，无法检查用户信息');
      return false;
    }
    
    try {
      const db = wx.cloud.database();
      const res = await db.collection('users').where({
        _openid: app.globalData.openid
      }).get();
      
      if (res.data.length === 0 || 
          !res.data[0].nickName || 
          !res.data[0].avatarUrl || 
          res.data[0].avatarUrl === '/images/avatar.png') {
        return true; // 需要完善用户信息
      }
      return false; // 用户信息已完善
    } catch (err) {
      console.error('检查用户信息失败', err);
      return false;
    }
  },
  
  async getUserInfo() {
    const app = getApp();
    if (!app.globalData.openid) {
      return null;
    }
    
    try {
      const db = wx.cloud.database();
      const res = await db.collection('users').where({
        _openid: app.globalData.openid
      }).get();
      
      if (res.data.length > 0) {
        return res.data[0];
      }
      return null;
    } catch (err) {
      console.error('获取用户信息失败', err);
      return null;
    }
  },
  
  async updateUserLocation(location) {
    const app = getApp();
    if (!app.globalData.openid) {
      console.log('用户未登录，无法更新位置');
      return false;
    }
    
    // 确保位置数据格式有效
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      console.error('无效的位置数据', location);
      return false;
    }
    
    const db = wx.cloud.database();
    try {
      console.log('更新用户位置:', location);
      
      // 更新到数据库，同时存储两种格式，兼容旧数据
      await db.collection('users').where({
        _openid: app.globalData.openid
      }).update({
        data: {
          // 1. 标准格式：直接存储latitude和longitude字段
          latitude: location.latitude,
          longitude: location.longitude,
          
          // 2. GeoJSON格式：用于地理位置查询
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          
          // 更新时间戳
          updatedTime: db.serverDate()
        }
      });
      
      return true;
    } catch (error) {
      console.error('更新位置失败', error);
      return false;
    }
  },
  
  async updateMyLocation() {
    try {
      const location = await LocationService.getCurrentLocation();
      return this.updateUserLocation(location);
    } catch (error) {
      console.error('获取或更新位置失败', error);
      return false;
    }
  }
};

module.exports = UserService; 