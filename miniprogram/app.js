// app.js
App({
  globalData: {
    openid: null,
    systemInfo: null,
  },
  
  onLaunch: async function() {
    try {
      await this.initSystemInfo();
      await this.initCloudEnv();
      await this.initOpenid();
    } catch (error) {
      console.error('[应用初始化失败]', error);
      wx.showToast({
        title: `初始化失败：${error.message}`,
        icon: 'error',
        duration: 3000
      });
    }
  },

  // 初始化系统信息
  async initSystemInfo() {
    try {
      const systemInfo = await wx.getSystemInfo();
      this.globalData.systemInfo = systemInfo;
      console.log('[系统信息]', systemInfo);
    } catch (error) {
      console.error('[系统信息] 获取失败', error);
      throw new Error('获取系统信息失败');
    }
  },

  // 初始化云环境
  async initCloudEnv() {
    if (!wx.cloud) {
      throw new Error('请使用 2.2.3 或以上的基础库以使用云能力');
    }
    
    try {
      await wx.cloud.init({
        env: wx.cloud.DYNAMIC_CURRENT_ENV,
        traceUser: true,
      });
    } catch (error) {
      console.error('[云环境] 初始化失败', error);
      throw new Error('云环境初始化失败');
    }
  },
  
  // 初始化获取用户openid（仅在应用启动时调用）
  async initOpenid() {
    const openid = await this._fetchOpenid();
    this.globalData.openid = openid;
    return openid;
  },

  // 获取用户openid（供其他页面调用）
  async getOpenid() {
    // 如果已经有openid，直接返回
    if (this.globalData.openid) {
      return this.globalData.openid;
    }
    
    // 如果没有，重新获取
    const openid = await this._fetchOpenid();
    this.globalData.openid = openid;
    return openid;
  },

  // 私有方法：实际获取openid的逻辑
  async _fetchOpenid() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'login'
      });
      console.log('[云函数] [login] 调用成功', res);
      return res.result.openid;
    } catch (error) {
      console.error('[云函数] [login] 调用失败', error);
      throw new Error('获取openid失败');
    }
  }
});
