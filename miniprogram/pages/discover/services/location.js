// 位置服务模块
const LocationService = {
  async getCurrentLocation() {
    try {
      return await wx.getLocation({ type: 'gcj02' });
    } catch (error) {
      wx.showToast({
        title: '获取位置信息失败',
        icon: 'none'
      });
      return { latitude: 39.9087, longitude: 116.3975 }; // 默认位置
    }
  },

  isInSameRegion(region1, region2) {
    if (!region1 || !region2) return false;
    
    const { southwest: sw1, northeast: ne1 } = region1;
    const { southwest: sw2, northeast: ne2 } = region2;
    
    // 简化区域比较逻辑
    const isSame = 
      Math.abs(sw1.latitude - sw2.latitude) < 0.01 &&
      Math.abs(sw1.longitude - sw2.longitude) < 0.01 &&
      Math.abs(ne1.latitude - ne2.latitude) < 0.01 &&
      Math.abs(ne1.longitude - ne2.longitude) < 0.01;
      
    return isSame;
  }
};

module.exports = LocationService; 