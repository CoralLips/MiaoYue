// 引入服务模块
const LocationService = require('./services/location');
const MarkerService = require('./services/marker');
const UserService = require('./services/user');
const { TAB_BAR_ITEMS } = require('../../utils/constants');

Page({
  data: {
    latitude: 39.9087,
    longitude: 116.3975,
    mapScale: 14,
    markers: [],
    filteredMarkers: [],
    searchKeyword: '',
    currentFilter: 'all',
    showChannelPopup: false,
    showUserPopup: false,
    currentUser: null,
    needUserInfo: false,
    debounceTimer: null,
    regionCache: {
      data: null,
      timestamp: 0,
      region: null
    }
  },

  onLoad() {
    this.initLocation();
    this.loadMarkers();
    this.checkUserInfo();
  },

  onShow() {
    this.updateMyLocation();
    this.updateTabBarSelection();
  },

  updateTabBarSelection() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: TAB_BAR_ITEMS.DISCOVER
      });
    }
  },

  async initLocation() {
    const location = await LocationService.getCurrentLocation();
    this.setData({
      latitude: location.latitude,
      longitude: location.longitude
    });
  },

  async loadMarkers() {
    try {
      // 获取当前地图视图区域
      const mapCtx = wx.createMapContext('map');
      mapCtx.getRegion({
        success: async (res) => {
          await this.loadUsersInRegion(res.southwest, res.northeast);
        },
        fail: (err) => {
          console.error('获取地图区域失败', err);
          wx.showToast({
            title: '加载数据失败',
            icon: 'none'
          });
        }
      });
    } catch (error) {
      console.error('加载标记失败', error);
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    }
  },

  updateMarkers(markers) {
    const filteredMarkers = MarkerService.filterMarkers(
      markers, 
      this.data.currentFilter,
      this.data.searchKeyword
    );
    
    this.setData({ markers, filteredMarkers });
  },

  // 合并搜索输入和搜索确认功能
  onSearchInput(e) {
    const { value } = e.detail;
    this.setData({ searchKeyword: value });
    this.updateFilteredMarkers();
  },

  // 搜索按钮确认
  onSearch() {
    this.updateFilteredMarkers();
  },

  // 更新过滤后的标记
  updateFilteredMarkers() {
    const filteredMarkers = MarkerService.filterMarkers(
      this.data.markers, 
      this.data.currentFilter, 
      this.data.searchKeyword
    );
    this.setData({ filteredMarkers });
  },

  onRegionChange(e) {
    if (this.data.debounceTimer) {
      clearTimeout(this.data.debounceTimer);
    }

    if (e.type === 'end') {
      const debounceTimer = setTimeout(() => {
        const mapCtx = wx.createMapContext('map');
        mapCtx.getRegion({
          success: (res) => {
            this.loadUsersInRegion(res.southwest, res.northeast);
          }
        });
      }, 300);

      this.setData({ debounceTimer });
    }
  },

  async loadUsersInRegion(southwest, northeast) {
    console.log('开始加载区域内用户', {southwest, northeast});
    
    const result = await UserService.fetchUsersInRegion(
      southwest, 
      northeast, 
      this.data.regionCache
    );
    
    if (result.fromCache) {
      console.log('使用缓存数据');
    } else {
      this.setData({
        regionCache: {
          data: result.data,
          timestamp: result.timestamp,
          region: result.region
        }
      });
    }
    
    const markers = MarkerService.processMarkers(result.data);
    this.updateMarkers(markers);
  },

  onMarkerTap(e) {
    const { markerId } = e.detail;
    const marker = this.data.filteredMarkers.find(m => m.id === markerId);
    if (marker) {
      this.showUserPopup(marker.userData);
    }
  },

  moveToCurrentLocation() {
    this.initLocation();
  },

  toggleChannelPopup() {
    this.setData({
      showChannelPopup: !this.data.showChannelPopup
    });
  },

  closeChannelPopup() {
    this.setData({
      showChannelPopup: false
    });
  },

  onFilterChange(e) {
    const { type } = e.detail;
    this.setData({
      currentFilter: type,
      showChannelPopup: false
    });
    this.updateFilteredMarkers();
  },

  showUserPopup(userData) {
    this.setData({
      currentUser: userData,
      showUserPopup: true
    });
  },

  closeUserPopup() {
    this.setData({
      showUserPopup: false,
      currentUser: null
    });
  },

  viewUserDetail() {
    const { currentUser } = this.data;
    if (currentUser) {
      wx.navigateTo({
        url: `/pages/user/detail/index?id=${currentUser.id}`,
        fail: (err) => {
          console.error('跳转用户详情页失败', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    } else {
      console.error('无法获取用户openid', this.data.currentUser);
      wx.showToast({
        title: '无法访问用户主页',
        icon: 'none'
      });
    }
  },

  async refreshLocations() {
    // 简单文本提示，无动画，短时间显示
    wx.showToast({
      title: '加载中...',
      icon: 'none',
      duration: 800,
      mask: false
    });
    
    try {
      await this.loadMarkers();
    } catch (error) {
      console.error('刷新位置失败', error);
    }
  },

  async checkUserInfo() {
    const needUserInfo = await UserService.checkUserInfo();
    this.setData({ needUserInfo });
  },

  async updateMyLocation() {
    await UserService.updateMyLocation();
  }
}); 