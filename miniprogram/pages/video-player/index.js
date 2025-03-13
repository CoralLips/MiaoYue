// pages/video-player/index.js
Page({
  data: {
    videoUrl: '',
    loading: true
  },

  onLoad(options) {
    if (options.fileID) {
      const fileID = decodeURIComponent(options.fileID);
      this.setData({
        videoUrl: fileID,
        loading: false
      });
    } else {
      wx.showToast({
        title: '视频不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 视频加载错误
  videoError(e) {
    console.error('视频加载错误', e);
    wx.showToast({
      title: '视频加载失败',
      icon: 'error'
    });
  }
}); 