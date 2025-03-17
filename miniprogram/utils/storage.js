// 存储工具
const storage = {
  // 设置存储
  set(key, data, expire) {
    const storageData = {
      data,
      expire: expire ? Date.now() + expire : null
    };
    wx.setStorageSync(key, storageData);
  },

  // 获取存储
  get(key) {
    try {
      const storageData = wx.getStorageSync(key);
      if (!storageData) return null;

      // 检查是否过期
      if (storageData.expire && Date.now() > storageData.expire) {
        this.remove(key);
        return null;
      }

      return storageData.data;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  // 移除存储
  remove(key) {
    try {
      wx.removeStorageSync(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  },

  // 清空存储
  clear() {
    try {
      wx.clearStorageSync();
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  }
};

module.exports = storage; 