// packages/media/video-player/index.js
Page({
  data: {
    videoUrl: '',
    error: false,
    errorMsg: '',
    fileID: '',
    videoContext: null
  },

  onLoad(options) {
    console.log('[视频播放器] 页面加载，参数：', options);
    
    if (options.fileID) {
      const fileID = decodeURIComponent(options.fileID);
      console.log('[视频播放器] 解码后的fileID：', fileID);
      
      this.setData({ fileID });
      this.loadVideo(fileID);
    } else {
      console.error('[视频播放器] 缺少必要的fileID参数');
      this.showError('视频不存在');
    }

    // 创建视频上下文
    this.videoContext = wx.createVideoContext('myVideo', this);
  },

  onUnload() {
    // 页面卸载时停止播放
    if (this.videoContext) {
      this.videoContext.stop();
    }
  },

  // 加载视频
  loadVideo(fileID) {
    console.log('[视频播放器] 开始获取视频临时链接');
    
    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: res => {
        const result = res.fileList[0];
        console.log('[视频播放器] 获取临时链接结果：', result);
        
        if (result.status === 0 && result.tempFileURL) {
          console.log('[视频播放器] 成功获取临时链接');
          this.setData({
            videoUrl: result.tempFileURL
          });
        } else {
          console.error('[视频播放器] 获取临时链接失败', result);
          this.showError('获取视频地址失败：' + (result.errMsg || '未知错误'));
        }
      },
      fail: err => {
        console.error('[视频播放器] 获取临时链接请求失败：', err);
        this.showError('获取视频地址失败：' + (err.errMsg || '未知错误'));
      }
    });
  },

  // 视频播放事件
  onVideoPlay() {
    console.log('[视频播放器] 开始播放');
  },

  // 视频暂停事件
  onVideoPause() {
    console.log('[视频播放器] 暂停播放');
  },

  // 视频结束事件
  onVideoEnded() {
    console.log('[视频播放器] 播放结束');
  },

  // 视频加载等待
  onVideoWaiting() {
    console.log('[视频播放器] 视频加载中');
  },

  // 视频进度更新
  onTimeUpdate(e) {
    // console.log('[视频播放器] 播放进度更新：', e.detail.currentTime);
  },

  // 视频缓冲进度
  onVideoProgress(e) {
  },

  // 视频错误处理
  videoError(e) {
    console.error('[视频播放器] 视频加载错误：', {
      error: e.detail,
      fileID: this.data.fileID,
      videoUrl: this.data.videoUrl
    });
    
    this.showError('视频播放失败：' + (e.detail.errMsg || '未知错误'));
  },

  // 显示错误
  showError(message) {
    this.setData({
      error: true,
      errorMsg: message
    });
  },

  // 重试加载
  retryLoad() {
    if (this.data.fileID) {
      this.loadVideo(this.data.fileID);
    }
  },

  // 返回上一页
  goBack() {
    console.log('[视频播放器] 用户点击返回');
    wx.navigateBack();
  }
}); 