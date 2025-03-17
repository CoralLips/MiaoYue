// 图片处理工具
const DEFAULT_PLACEHOLDER = '/images/placeholder.png';

// 图片加载状态管理
const imageLoadingMap = new Map();

const imageUtils = {
  // 获取图片信息
  getImageInfo(src) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src,
        success: resolve,
        fail: reject
      });
    });
  },

  // 压缩图片
  compressImage(src, quality = 80) {
    return new Promise((resolve, reject) => {
      wx.compressImage({
        src,
        quality,
        success: resolve,
        fail: reject
      });
    });
  },

  // 检查图片是否已加载
  isImageLoaded(src) {
    return imageLoadingMap.get(src) === 'loaded';
  },

  // 设置图片加载状态
  setImageLoadStatus(src, status) {
    imageLoadingMap.set(src, status);
  },

  // 清理图片加载状态
  clearImageLoadStatus(src) {
    imageLoadingMap.delete(src);
  },

  // 预加载图片
  preloadImages(urls = []) {
    return Promise.all(
      urls.map(url => 
        this.getImageInfo(url)
          .then(() => this.setImageLoadStatus(url, 'loaded'))
          .catch(() => this.setImageLoadStatus(url, 'error'))
      )
    );
  }
};

module.exports = {
  imageUtils,
  DEFAULT_PLACEHOLDER
}; 