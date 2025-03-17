// 页面基类
const eventBus = require('./event');
const { request } = require('./request');

const basePage = {
  data: {
    loading: false,
    error: false,
    errorMessage: '',
    _eventListeners: []
  },

  onLoad() {
    this._initPage();
  },

  onUnload() {
    this._cleanupPage();
  },

  // 页面初始化
  _initPage() {
    // 可以在这里添加页面初始化的通用逻辑
  },

  // 页面清理
  _cleanupPage() {
    // 清理事件监听
    this.data._eventListeners.forEach(({ event, callback }) => {
      eventBus.off(event, callback);
    });
  },

  // 注册事件监听
  registerEvent(event, callback) {
    eventBus.on(event, callback);
    this.data._eventListeners.push({ event, callback });
  },

  // 触发事件
  triggerEvent(event, data) {
    eventBus.emit(event, data);
  },

  // 显示加载状态
  showLoading() {
    this.setData({ loading: true, error: false });
  },

  // 隐藏加载状态
  hideLoading() {
    this.setData({ loading: false });
  },

  // 显示错误状态
  showError(message) {
    this.setData({
      loading: false,
      error: true,
      errorMessage: message
    });
    console.error(message);
  },

  // 清除错误状态
  clearError() {
    this.setData({
      error: false,
      errorMessage: ''
    });
  },

  // 发起请求
  request(options) {
    return request({
      ...options,
      fail: (error) => {
        this.showError(error.message);
        throw error;
      }
    });
  }
};

module.exports = basePage; 