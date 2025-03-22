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
    
    // 从云数据库获取数据
    try {
      const db = wx.cloud.database();
      const _ = db.command;
      
      const res = await db.collection('users').where({
        'location.coordinates.0': _.gte(southwest.longitude).and(_.lte(northeast.longitude)),
        'location.coordinates.1': _.gte(southwest.latitude).and(_.lte(northeast.latitude))
      }).get();
      
      return {
        data: res.data,
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
    
    const db = wx.cloud.database();
    try {
      await db.collection('users').where({
        _openid: app.globalData.openid
      }).update({
        data: {
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
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