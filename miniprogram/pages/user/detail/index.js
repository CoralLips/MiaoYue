Page({
  data: {
    userInfo: null,
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
    this.setData({
      loading: true
    });
    
    // 查询用户资料
    db.collection('users').where({
      _openid: openid
    }).get().then(res => {
      if (res.data.length > 0) {
        // 用户存在，加载资料
        const userInfo = res.data[0];
        this.setData({
          userInfo: {
            avatarUrl: userInfo.avatarUrl || '/images/avatar.png',
            nickName: userInfo.nickName || '匿名用户',
            _openid: openid,
            introduction: userInfo.introduction || '这个用户很懒，还没有填写介绍~',
            mediaList: userInfo.mediaList || [],
            wechat: userInfo.wechat || '',
            phone: userInfo.phone || ''
          },
          loading: false
        });
      } else {
        wx.showToast({
          title: '用户不存在',
          icon: 'error'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }).catch(err => {
      console.error('获取用户资料失败', err);
      this.setData({
        loading: false
      });
      wx.showToast({
        title: '获取用户资料失败',
        icon: 'none'
      });
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 预览媒体
  previewMedia(e) {
    const index = e.detail.index;
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