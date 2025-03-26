// 引入服务模块
const LocationService = require('./services/location');
const MarkerService = require('./services/marker');
const UserService = require('./services/user');
const AvatarService = require('./services/avatar');
const { TAB_BAR_ITEMS } = require('../../utils/constants');
const db = wx.cloud.database(); // 添加数据库引用

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
    canvasSize: 200, // 用于绘制圆形头像的Canvas大小
    debounceTimer: null,
    regionCache: {
      data: null,
      timestamp: 0,
      region: null
    }
  },

  // ===== 生命周期函数 =====
  onLoad() {
    this.initLocation();
    this.loadMarkers();
    this.checkUserInfo();
  },

  onShow() {
    this.updateMyLocation();
    this.updateTabBarSelection();
    
    // 每次页面显示时重新加载标记，确保使用圆形头像
    this.loadMarkers();
  },

  updateTabBarSelection() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: TAB_BAR_ITEMS.DISCOVER
      });
    }
  },

  onReady() {
    // 获取地图上下文
    this.mapCtx = wx.createMapContext('map');
  },

  onUnload() {
    // 清理计时器
    if (this.data.debounceTimer) {
      clearTimeout(this.data.debounceTimer);
    }
  },

  // ===== 位置与地图相关 =====
  async initLocation() {
    try {
      const location = await LocationService.getCurrentLocation();
      this.setData({
        latitude: location.latitude,
        longitude: location.longitude
      });
    } catch (error) {
      console.error('获取位置失败', error);
      // 使用默认位置
      wx.showToast({
        title: '获取位置失败，使用默认位置',
        icon: 'none'
      });
    }
  },

  moveToCurrentLocation() {
    LocationService.getCurrentLocation()
      .then(res => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
      })
      .catch(err => {
        console.error('获取位置失败', err);
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        });
      });
  },

  async updateMyLocation() {
    await UserService.updateMyLocation();
  },

  // ===== 标记点加载与更新 =====
  async loadMarkers() {
    try {
      // 使用showToast替代showLoading，不显示图标
      wx.showToast({
        title: '加载中...',
        icon: 'none',
        duration: 60000 // 足够长的时间
      });
      
      console.log('开始加载地图标记点...');
      // 获取用户数据
      const usersRes = await db.collection('users').limit(100).get();
      const users = usersRes.data;
      console.log('获取到的用户数据:', users.length);
      
      // 处理每个用户的头像为圆形，使用专门的头像处理服务
      const processedUsers = await AvatarService.processUsersAvatars(users);
      
      // 创建标记点
      const markers = MarkerService.processMarkers(processedUsers);
      console.log('生成的地图标记点:', markers.length);
      
      // 更新标记点
      this.updateMarkers(markers);
      
      wx.hideToast();
    } catch (error) {
      console.error('加载标记点失败', error);
      wx.hideToast();
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
    
    // 确保处理圆形头像
    const processedUsers = await AvatarService.processUsersAvatars(result.data);
    const markers = MarkerService.processMarkers(processedUsers);
    this.updateMarkers(markers);
  },

  async refreshLocations() {
    // 使用showToast，不显示图标
    wx.showToast({
      title: '刷新中...',
      icon: 'none',
      duration: 60000 // 足够长的时间
    });
    
    try {
      await this.loadMarkers();
    } catch (error) {
      console.error('刷新位置失败', error);
    } finally {
      wx.hideToast();
    }
  },

  // ===== 地图交互事件 =====
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

  onMarkerTap(e) {
    const { markerId } = e.detail;
    console.log('点击标记点:', markerId, '类型:', typeof markerId);
    
    // 数值类型转换，确保比较一致性
    const markerIdNumber = Number(markerId);
    
    // 在markers中查找对应的标记点
    const marker = this.data.markers.find(m => m.id === markerIdNumber);
    if (marker) {
      console.log('找到对应标记点:', marker.id);
      this.showUserPopup(marker.userData);
      return;
    }
    
    // 尝试在filteredMarkers中查找
    const filteredMarker = this.data.filteredMarkers.find(m => m.id === markerIdNumber);
    if (filteredMarker) {
      console.log('在filteredMarkers中找到标记点:', filteredMarker.id);
      this.showUserPopup(filteredMarker.userData);
      return;
    }
    
    // 最后一种方式：通过遍历所有markers的userData.markerId查找
    for (const m of this.data.markers) {
      if (m.userData && m.userData.markerId === markerIdNumber) {
        console.log('通过userData.markerId找到标记点:', m.id);
        this.showUserPopup(m.userData);
        return;
      }
    }
    
    console.error('未找到对应标记点，ID:', markerId, '可用的标记点ID:', this.data.markers.map(m => m.id));
  },

  // ===== 搜索与筛选 =====
  onSearchInput(e) {
    const { value } = e.detail;
    this.setData({ searchKeyword: value });
    this.updateFilteredMarkers();
  },

  onSearch() {
    this.updateFilteredMarkers();
  },

  updateFilteredMarkers() {
    const filteredMarkers = MarkerService.filterMarkers(
      this.data.markers, 
      this.data.currentFilter, 
      this.data.searchKeyword
    );
    this.setData({ filteredMarkers });
  },

  onFilterChange(e) {
    const { type } = e.detail;
    this.setData({
      currentFilter: type,
      showChannelPopup: false
    });
    this.updateFilteredMarkers();
  },

  // ===== 弹窗管理 =====
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

  showUserPopup(userData) {
    // 确保userData有效
    if (!userData) {
      console.error('无效的用户数据');
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
      return;
    }
    
    console.log('显示用户信息:', userData);
    
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

  // ===== 用户相关 =====
  async checkUserInfo() {
    const app = getApp();
    if (app.globalData.userInfo) {
      return;
    }
    
    try {
      const userRes = await db.collection('users').where({
        _openid: app.globalData.openid
      }).get();
      
      if (userRes.data.length === 0) {
        // 如果用户不存在，则显示引导
        this.setData({
          needUserInfo: true
        });
      } else {
        // 设置全局用户信息
        app.globalData.userInfo = userRes.data[0];
      }
    } catch (error) {
      console.error('检查用户信息失败', error);
    }
  },

  viewUserDetail() {
    const { currentUser } = this.data;
    if (currentUser && currentUser.openid) {
      wx.navigateTo({
        url: `/packages/user/detail/index?openid=${currentUser.openid}`,
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
  }
}); 