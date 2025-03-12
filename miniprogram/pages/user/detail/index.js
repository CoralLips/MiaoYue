Page({
  data: {
    userInfo: null,
    userTags: ['喜欢跑步', '会摄影', '会按摩'], // 示例标签
    userTrustData: {
      trustScore: 85,
      responseRate: '90%',
      availableTime: '周末',
      safetyRating: 4.5
    },
    loading: true
  },

  onLoad(options) {
    if (options.openid) {
      this.loadUserInfo(options.openid);
    } else {
      wx.showToast({
        title: '用户ID不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载用户信息
  loadUserInfo(openid) {
    const db = wx.cloud.database();
    
    // 显示加载中
    wx.showLoading({
      title: '加载中...'
    });
    
    // 同时查询用户位置信息和用户详细资料
    Promise.all([
      // 查询用户位置信息
      db.collection('user_locations').where({
        _openid: openid
      }).get(),
      
      // 查询用户详细资料
      db.collection('users').where({
        _openid: openid
      }).get()
    ]).then(([locationRes, userRes]) => {
      // 合并用户信息
      let userInfo = {};
      
      if (locationRes.data.length > 0) {
        // 有位置信息
        userInfo = {...locationRes.data[0]};
      }
      
      if (userRes.data.length > 0) {
        // 有用户详细资料，合并信息
        userInfo = {...userInfo, ...userRes.data[0]};
      }
      
      if (Object.keys(userInfo).length > 0) {
        this.setData({
          userInfo: userInfo,
          loading: false
        });
      } else {
        // 用户不存在
        wx.showToast({
          title: '用户不存在',
          icon: 'error'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
      
      wx.hideLoading();
    }).catch(err => {
      console.error('获取用户信息失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'error'
      });
    });
  },
  
  // 返回地图页面
  goBack() {
    wx.navigateBack();
  },
  
  // 预览媒体
  previewMedia(e) {
    const index = e.currentTarget.dataset.index;
    const media = this.data.userInfo.mediaList[index];
    
    if (media.type === 'image') {
      // 预览图片
      const imageUrls = this.data.userInfo.mediaList
        .filter(item => item.type === 'image')
        .map(item => item.fileID);
      
      wx.previewImage({
        current: media.fileID,
        urls: imageUrls
      });
    } else if (media.type === 'video') {
      // 播放视频
      wx.navigateTo({
        url: `/pages/video-player/index?fileID=${encodeURIComponent(media.fileID)}`
      });
    }
  }
}); 