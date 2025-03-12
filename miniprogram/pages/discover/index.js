Page({
  data: {
    latitude: 23.099994,
    longitude: 113.324520,
    markers: [],
    filteredMarkers: [], // 筛选后的标记点
    mapScale: 14,
    // 添加用户弹窗相关数据
    showUserPopup: false,
    currentUser: null,
    // 搜索相关数据
    searchKeyword: '',
    currentFilter: 'all',
    searchCache: {
      key: null,
      region: null,
      results: null,
      timestamp: null
    },
    // 其他数据保持不变
    userTags: ['喜欢跑步', '会摄影', '会按摩'],
    userTrustData: {
      trustScore: 85,
      responseRate: '90%',
      availableTime: '周末',
      safetyRating: 4.5
    },
    showChannelPopup: false,
    needUserInfo: false, // 是否需要获取用户信息
    debounceTimer: null,
    currentRegion: null,
  },

  onLoad() {
    // 初始化时获取当前位置
    this.getLocation();
    this.checkUserInfo();
  },

  onShow() {
    // 进入页面时更新位置
    this.updateMyLocation();
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
  },

  // 搜索相关方法
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    // 实时搜索
    this.debounceSearch();
  },

  // 防抖处理
  debounceTimer: null,
  debounceSearch() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.onSearch();
    }, 500);
  },

  // 切换频道弹窗
  toggleChannelPopup() {
    this.setData({
      showChannelPopup: !this.data.showChannelPopup
    });
  },

  // 关闭频道弹窗
  closeChannelPopup() {
    this.setData({
      showChannelPopup: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  // 切换筛选类型
  onFilterChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      currentFilter: type,
      showChannelPopup: false
    });
    
    // 根据筛选类型更新地图标记
    this.updateMapMarkers();
  },

  // 更新地图标记
  updateMapMarkers() {
    const { currentFilter, markers } = this.data;
    
    if (currentFilter === 'all') {
      this.setData({
        filteredMarkers: markers
      });
      return;
    }

    // 根据类型筛选标记
    const filteredMarkers = markers.filter(marker => {
      if (currentFilter === 'users') {
        return marker.userData && !marker.userData.isBusiness && !marker.userData.isEvent;
      }
      if (currentFilter === 'business') {
        return marker.userData && marker.userData.isBusiness;
      }
      if (currentFilter === 'events') {
        return marker.userData && marker.userData.isEvent;
      }
      return true;
    });

    this.setData({
      filteredMarkers
    });
  },

  // 搜索方法
  async onSearch() {
    const mapContext = wx.createMapContext('map');
    
    try {
      // 获取当前地图可视区域
      const res = await new Promise((resolve, reject) => {
        mapContext.getRegion({
          success: resolve,
          fail: reject
        });
      });

      const { southwest, northeast, center } = res;
      const scale = this.data.mapScale;
      const keyword = this.data.searchKeyword;
      const types = this.data.currentFilter === 'all' ? 
        ['users', 'business', 'events'] : 
        [this.data.currentFilter];

      // 检查是否可以使用缓存
      if (this.shouldUseCache(keyword, types, southwest, northeast)) {
        this.updateMarkersFromCache();
        return;
      }

      // 调用云函数搜索
      const searchResult = await wx.cloud.callFunction({
        name: 'searchInRegion',
        data: {
          region: {
            southwest,
            northeast,
            center
          },
          keyword,
          types,
          scale
        }
      });

      if (searchResult.result.success) {
        // 更新缓存
        this.updateSearchCache(keyword, types, southwest, northeast, searchResult.result.data);
        
        // 处理返回的数据
        const markers = this.processSearchResults(searchResult.result);
        this.setData({
          filteredMarkers: markers
        });
      } else {
        throw new Error('搜索失败');
      }
    } catch (error) {
      console.error('搜索出错:', error);
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      });
    }
  },

  // 处理搜索结果
  processSearchResults(result) {
    if (result.type === 'clustered') {
      // 处理聚合数据
      return result.data.map((cluster, index) => ({
        id: `cluster_${index}`,
        latitude: cluster._id.region.coordinates[1],
        longitude: cluster._id.region.coordinates[0],
        width: 40,
        height: 40,
        callout: {
          content: `${cluster.count}个`,
          padding: 10,
          borderRadius: 5,
          display: 'ALWAYS'
        },
        // 存储聚合数据供点击时使用
        clusterData: cluster.items
      }));
    } else {
      // 处理详细标记点
      return result.data.map((item, index) => {
        const marker = {
          id: index + 1,
          latitude: item.location.latitude,
          longitude: item.location.longitude,
          width: 30,
          height: 30,
          callout: {
            content: item.nickName || '匿名用户',
            padding: 10,
            borderRadius: 5,
            display: 'BYCLICK',
            textAlign: 'center',
            fontSize: 14,
            bgColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#cccccc'
          },
          iconPath: item.type === 'user' && item.avatarUrl ? item.avatarUrl : this.getMarkerIcon(item.type, item),
          userData: item
        };
        
        return marker;
      });
    }
  },

  // 获取标记点图标
  getMarkerIcon(type, userData) {
    if (type === 'business') {
      return '/images/business.png';
    } else if (type === 'event') {
      // 由于没有event.png，使用business.png代替
      return '/images/business.png';
    } else if (type === 'user') {
      // 如果有用户数据且有头像，则返回用户头像
      if (userData && userData.avatarUrl) {
        return userData.avatarUrl;
      }
      return '/images/avatar.png';
    }
    return '/images/user-location.png';
  },

  // 缓存相关方法
  shouldUseCache(keyword, types, southwest, northeast) {
    const cache = this.data.searchCache;
    if (!cache.results) return false;
    if (cache.key !== keyword) return false;
    if (!this.isSameRegion(cache.region, { southwest, northeast })) return false;
    if (Date.now() - cache.timestamp > 5 * 60 * 1000) return false; // 5分钟缓存
    return true;
  },

  isSameRegion(region1, region2) {
    if (!region1 || !region2) return false;
    return (
      Math.abs(region1.southwest.latitude - region2.southwest.latitude) < 0.001 &&
      Math.abs(region1.southwest.longitude - region2.southwest.longitude) < 0.001 &&
      Math.abs(region1.northeast.latitude - region2.northeast.latitude) < 0.001 &&
      Math.abs(region1.northeast.longitude - region2.northeast.longitude) < 0.001
    );
  },

  updateSearchCache(keyword, types, southwest, northeast, results) {
    this.setData({
      'searchCache.key': keyword,
      'searchCache.region': { southwest, northeast },
      'searchCache.results': results,
      'searchCache.timestamp': Date.now()
    });
  },

  updateMarkersFromCache() {
    const markers = this.processSearchResults({
      type: this.data.mapScale <= 12 ? 'clustered' : 'detailed',
      data: this.data.searchCache.results
    });
    this.setData({
      filteredMarkers: markers
    });
  },

  // 地图事件处理
  onRegionChange(e) {
    if (this.data.debounceTimer) {
      clearTimeout(this.data.debounceTimer);
    }

    if (e.type === 'end') {
      this.setData({
        debounceTimer: setTimeout(() => {
          const mapCtx = wx.createMapContext('map');
          mapCtx.getRegion({
            success: (res) => {
              this.loadUsersInRegion(res.southwest, res.northeast);
            }
          });
        }, 200)
      });
    }
  },

  // 加载区域内的用户
  loadUsersInRegion(southwest, northeast) {
    const db = wx.cloud.database();
    const _ = db.command;
    const app = getApp();
    
    console.log('开始加载区域内用户', {southwest, northeast});
    
    const query = {
      visible: true,
      'location.latitude': _.gte(southwest.latitude).and(_.lte(northeast.latitude)),
      'location.longitude': _.gte(southwest.longitude).and(_.lte(northeast.longitude))
    };

    db.collection('user_locations')
      .where(query)
      .get()
      .then(res => {
        console.log('获取到用户数据:', res.data);
        if (res.data.length === 0) {
          console.log('该区域没有用户数据');
          this.setData({ markers: [] });
          return;
        }
        this.processAndUpdateMarkers(res.data);
      })
      .catch(err => {
        console.error('获取用户位置失败', err);
        wx.showToast({
          title: '获取用户数据失败',
          icon: 'none'
        });
      });
  },

  // 处理并更新标记
  async processAndUpdateMarkers(users) {
    const app = getApp();
    const markers = [];
    
    console.log('开始处理用户数据，总数:', users.length);
    
    for (const user of users) {
      // 跳过当前用户
      if (user._openid === app.globalData.openid) {
        console.log('跳过当前用户');
        continue;
      }

      // 使用默认头像或用户头像
      const avatarUrl = user.avatarUrl || '/images/default-avatar.png';
      
      markers.push({
        id: markers.length + 1,
        latitude: user.location.latitude,
        longitude: user.location.longitude,
        iconPath: avatarUrl,
        width: 36,
        height: 36,
        anchor: {x: 0.5, y: 0.5},
        label: {
          content: '',
          color: '#00000000',
          bgColor: '#00000000',
          padding: 0,
          borderWidth: 0,
          borderRadius: 18,
          textAlign: 'center',
          fontSize: 12
        },
        userData: {
          ...user,
          openid: user._openid
        }
      });
    }

    console.log('处理完成，标记数量:', markers.length);
    
    this.setData({ 
      markers,
      filteredMarkers: markers 
    }, () => {
      console.log('标记已更新到地图');
    });
  },

  // 标记点点击处理
  onMarkerTap(e) {
    const markerId = e.markerId;
    const marker = this.data.filteredMarkers.find(item => item.id === markerId);
    
    if (marker && marker.userData) {
      // 显示用户弹窗
      this.setData({
        showUserPopup: true,
        currentUser: marker.userData
      });
    }
  },

  // 处理聚合点击
  handleClusterTap(cluster) {
    // 放大地图或显示聚合详情
    if (this.data.mapScale < 16) {
      this.setData({
        mapScale: this.data.mapScale + 2
      });
    } else {
      // 显示聚合内的所有点位列表
      // 这里可以添加显示聚合详情的逻辑
    }
  },

  // 检查位置权限
  checkLocationAuth() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation'] === false) {
          // 用户曾经拒绝过权限，显示提示
          wx.showModal({
            title: '需要位置权限',
            content: '请允许小程序获取位置信息，以便在地图上显示',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.userLocation']) {
                      this.getLocation();
                    }
                  }
                });
              }
            }
          });
        } else {
          // 直接获取位置
          this.getLocation();
        }
      },
      fail: () => {
        wx.showToast({
          title: '获取权限失败',
          icon: 'none'
        });
      }
    });
  },

  // 获取位置信息
  getLocation() {
    console.log('开始获取位置');
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const {latitude, longitude} = res;
        console.log('获取位置成功:', {latitude, longitude});
        
        this.setData({
          latitude,
          longitude
        }, () => {
          // 更新用户位置到数据库
          this.updateMyLocation(latitude, longitude);
          
          // 获取当前地图上下文
          const mapCtx = wx.createMapContext('map');
          // 移动到当前位置
          mapCtx.moveToLocation({
            success: () => {
              console.log('移动到当前位置成功');
              // 获取当前可视区域并加载用户
              mapCtx.getRegion({
                success: (region) => {
                  console.log('获取地图区域成功:', region);
                  this.loadUsersInRegion(region.southwest, region.northeast);
                }
              });
            }
          });
        });
      },
      fail: (err) => {
        console.error('获取位置失败', err);
        wx.showToast({
          title: '获取位置失败，请检查定位权限',
          icon: 'none'
        });
      }
    });
  },
  
  // 更新我的位置到数据库
  updateMyLocation(latitude, longitude) {
    const app = getApp();
    if (!app.globalData.openid) {
      console.log('用户未登录，无法更新位置');
      // 尝试获取openid
      app.getOpenid(() => {
        if (app.globalData.openid) {
          this.getLocation();
        }
      });
      return;
    }

    // 如果没有传入经纬度，先获取当前位置
    if (!latitude || !longitude) {
      this.getLocation();
      return;
    }
    
    // 获取用户在小程序内设置的信息
    this.getUserInfo().then(userInfo => {
      const db = wx.cloud.database();
      db.collection('user_locations').where({
        _openid: app.globalData.openid
      }).count().then(countRes => {
        if (countRes.total === 0) {
          // 新增位置记录
          db.collection('user_locations').add({
            data: {
              location: {
                latitude,
                longitude
              },
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl,
              visible: true,
              lastUpdateTime: db.serverDate(),
              // 添加用户标签和可信数据字段（初始值）
              tags: [],
              trustData: {
                trustScore: 0,
                responseRate: '0%',
                availableTime: '未知',
                safetyRating: 0
              }
            }
          }).then(() => {
            console.log('位置信息创建成功');
          }).catch(err => {
            console.error('位置信息创建失败', err);
          });
        } else {
          // 更新位置记录，同时更新用户信息
          db.collection('user_locations').where({
            _openid: app.globalData.openid
          }).update({
            data: {
              location: {
                latitude,
                longitude
              },
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl,
              lastUpdateTime: db.serverDate()
            }
          }).then(() => {
            console.log('位置信息更新成功');
          }).catch(err => {
            console.error('位置信息更新失败', err);
          });
        }
      });
    }).catch(err => {
      console.error('获取用户信息失败，只更新位置', err);
      // 即使获取用户信息失败，也要更新位置
      const db = wx.cloud.database();
      db.collection('user_locations').where({
        _openid: app.globalData.openid
      }).count().then(countRes => {
        if (countRes.total === 0) {
          // 新增位置记录，使用默认信息
          db.collection('user_locations').add({
            data: {
              location: {
                latitude,
                longitude
              },
              nickName: '用户' + app.globalData.openid.substring(0, 4),
              avatarUrl: '/images/avatar.png',
              visible: true,
              lastUpdateTime: db.serverDate(),
              tags: [],
              trustData: {
                trustScore: 0,
                responseRate: '0%',
                availableTime: '未知',
                safetyRating: 0
              }
            }
          }).then(() => {
            console.log('位置信息创建成功(默认信息)');
          }).catch(err => {
            console.error('位置信息创建失败', err);
          });
        } else {
          // 只更新位置和时间
          db.collection('user_locations').where({
            _openid: app.globalData.openid
          }).update({
            data: {
              location: {
                latitude,
                longitude
              },
              lastUpdateTime: db.serverDate()
            }
          }).then(() => {
            console.log('位置信息更新成功(仅位置)');
          }).catch(err => {
            console.error('位置信息更新失败', err);
          });
        }
      });
    });
  },
  
  // 获取用户信息
  getUserInfo() {
    return new Promise((resolve, reject) => {
      const app = getApp();
      if (!app.globalData.openid) {
        console.log('未登录，无法获取用户信息');
        reject(new Error('未登录'));
        return;
      }
      
      // 从数据库获取用户在小程序内设置的信息
      const db = wx.cloud.database();
      db.collection('users').where({
        _openid: app.globalData.openid
      }).get().then(res => {
        if (res.data.length > 0) {
          const userInfo = res.data[0];
          console.log('获取到用户在小程序内设置的信息', userInfo);
          resolve({
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          });
        } else {
          console.log('未找到用户信息，使用默认值');
          resolve({
            nickName: '用户' + app.globalData.openid.substring(0, 4),
            avatarUrl: '/images/avatar.png'
          });
        }
      }).catch(err => {
        console.error('获取用户信息失败', err);
        reject(err);
      });
    });
  },

  // 加载所有用户位置
  loadAllUserLocations() {
    console.log('开始加载用户位置');
    const db = wx.cloud.database();
    const _ = db.command;
    const app = getApp();
    
    // 检查是否有openid
    if (!app.globalData.openid) {
      console.log('用户未登录，尝试获取openid');
      app.getOpenid((openid) => {
        if (openid) {
          console.log('获取openid成功，重新加载用户位置');
          this.loadAllUserLocations();
        } else {
          console.error('获取openid失败');
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        }
      });
      return;
    }
    
    // 获取一小时内活跃的用户位置
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    // 基本查询条件
    let query = {
      visible: true,
      lastUpdateTime: _.gt(oneHourAgo)
    };
    
    console.log('查询用户位置数据', query);
    db.collection('user_locations').where(query).get().then(res => {
      console.log('获取到的用户位置', res.data);
      
      if (res.data.length === 0) {
        console.log('没有找到用户位置数据');
        this.setData({
          markers: [],
          filteredMarkers: []
        });
        return;
      }
      
      // 构建标记点数组
      const markers = res.data.map((item, index) => {
        const isCurrentUser = item._openid === app.globalData.openid;
        
        // 如果是当前用户，不添加到标记点数组中
        if (isCurrentUser) {
          return null;
        }
        
        // 确保头像URL有效
        const avatarUrl = item.avatarUrl && item.avatarUrl.trim() !== '' ? item.avatarUrl : '/images/default-avatar.png';
        
        return {
          id: index + 1,
          latitude: item.location.latitude,
          longitude: item.location.longitude,
          width: 30,
          height: 30,
          iconPath: avatarUrl,
          callout: {
            content: item.nickName || '匿名用户',
            padding: 10,
            borderRadius: 5,
            display: 'BYCLICK',
            textAlign: 'center',
            fontSize: 14,
            bgColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#cccccc'
          },
          userData: {
            openid: item._openid,
            nickName: item.nickName || '匿名用户',
            avatarUrl: avatarUrl,
            tags: item.tags || [],
            trustData: item.trustData || {
              trustScore: 0,
              responseRate: '0%',
              availableTime: '未知',
              safetyRating: 0
            }
          }
        };
      }).filter(marker => marker !== null);
      
      console.log('构建了', markers.length, '个标记点');
      this.setData({ 
        markers,
        filteredMarkers: markers
      }, () => {
        console.log('标记点已更新', this.data.filteredMarkers);
      });
    }).catch(err => {
      console.error('获取用户位置失败', err);
      wx.showToast({
        title: '获取用户位置失败',
        icon: 'none'
      });
    });
  },
  
  // 关闭用户弹窗
  closeUserPopup() {
    this.setData({
      showUserPopup: false,
      currentUser: null
    });
  },
  
  // 查看用户详情
  viewUserDetail() {
    if (this.data.currentUser && this.data.currentUser.openid) {
      wx.navigateTo({
        url: `/pages/user/detail/index?openid=${this.data.currentUser.openid}`
      });
      // 关闭弹窗
      this.closeUserPopup();
    } else {
      console.error('无法获取用户openid', this.data.currentUser);
      wx.showToast({
        title: '无法访问用户主页',
        icon: 'none'
      });
    }
  },
  
  // 刷新位置
  refreshLocations() {
    wx.showLoading({ title: '刷新中...' });
    
    // 1. 更新自己的位置
    this.updateMyLocation();
    
    // 2. 重新加载当前区域的用户
    const mapCtx = wx.createMapContext('map');
    mapCtx.getRegion({
      success: (res) => {
        this.loadUsersInRegion(res.southwest, res.northeast);
        wx.hideLoading();
      },
      fail: () => {
        wx.hideLoading();
      }
    });
  },

  // 移动到当前位置
  moveToCurrentLocation() {
    const mapCtx = wx.createMapContext('map');
    mapCtx.moveToLocation();
  },

  // 页面导航方法
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/index'
    });
  },

  // 检查是否有用户信息
  checkUserInfo() {
    const app = getApp();
    if (!app.globalData.openid) {
      console.log('未登录，无法检查用户信息');
      return;
    }
    
    const db = wx.cloud.database();
    db.collection('users').where({
      _openid: app.globalData.openid
    }).get().then(res => {
      if (res.data.length === 0 || !res.data[0].nickName || !res.data[0].avatarUrl || res.data[0].avatarUrl === '/images/avatar.png') {
        // 用户不存在或未设置昵称和头像
        this.setData({
          needUserInfo: true
        });
      } else {
        this.setData({
          needUserInfo: false
        });
      }
    }).catch(err => {
      console.error('检查用户信息失败', err);
    });
  },
  
  // 更新用户位置信息中的昵称和头像
  updateUserLocationInfo() {
    const app = getApp();
    if (!app.globalData.openid) {
      console.log('未登录，无法更新用户位置信息');
      return;
    }
    
    // 获取用户在小程序内设置的信息
    this.getUserInfo().then(userInfo => {
      const db = wx.cloud.database();
      db.collection('user_locations').where({
        _openid: app.globalData.openid
      }).update({
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl
        }
      }).then(() => {
        console.log('用户位置信息中的昵称和头像更新成功');
      }).catch(err => {
        console.error('用户位置信息中的昵称和头像更新失败', err);
      });
    }).catch(err => {
      console.error('获取用户信息失败', err);
    });
  },

  // 创建圆形头像
  createCircleAvatar(avatarUrl, index) {
    const ctx = wx.createCanvasContext('avatarCanvas');
    const size = 100; // 画布大小
    const radius = size / 2; // 圆形半径
    
    // 创建离屏画布
    wx.createSelectorQuery()
      .select('#avatarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.error('获取画布节点失败');
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 设置画布大小
        canvas.width = size;
        canvas.height = size;
        
        // 清空画布
        ctx.clearRect(0, 0, size, size);
        
        // 创建圆形裁剪区域
        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, Math.PI * 2, false);
        ctx.clip();
        
        // 加载头像图片
        const img = canvas.createImage();
        img.src = avatarUrl;
        img.onload = () => {
          // 绘制头像
          ctx.drawImage(img, 0, 0, size, size);
          
          // 添加白色边框
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.stroke();
          
          // 将画布内容保存为临时文件
          wx.canvasToTempFilePath({
            canvas: canvas,
            success: (res) => {
              console.log('头像圆形化成功', res.tempFilePath);
              // 保存临时文件路径
              this.avatarPaths = this.avatarPaths || {};
              this.avatarPaths[index] = res.tempFilePath;
            },
            fail: (err) => {
              console.error('头像圆形化失败', err);
            }
          });
        };
        
        img.onerror = (err) => {
          console.error('加载头像图片失败', err);
        };
      });
  },
}); 