Page({
  data: {
    latitude: 39.9087,
    longitude: 116.3975,
    mapScale: 14,
    markers: [],
    filteredMarkers: [],
    searchKeyword: '',
    isSearching: false,
    currentFilter: 'all',
    showChannelPopup: false,
    showUserPopup: false,
    currentUser: null,
    userTags: ['喜欢跑步', '会摄影', '会按摩'],
    userTrustData: {
      trustScore: 85,
      responseRate: '90%',
      availableTime: '周末',
      safetyRating: 4.5
    },
    needUserInfo: false,
    debounceTimer: null,
    currentRegion: null,
    regionCache: {
      data: null,
      timestamp: 0,
      region: null
    }
  },

  CACHE_DURATION: 30000,

  onLoad() {
    this.initLocation();
    this.loadMarkers();
    this.checkUserInfo();
  },

  onShow() {
    this.updateMyLocation();
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
  },

  async initLocation() {
    try {
      const { latitude, longitude } = await wx.getLocation({
        type: 'gcj02'
      });
      this.setData({
        latitude,
        longitude
      });
    } catch (error) {
      wx.showToast({
        title: '获取位置信息失败',
        icon: 'none'
      });
    }
  },

  async loadMarkers() {
    try {
      // TODO: 从云数据库加载标记点数据
      const markers = [];  // 替换为实际的数据加载逻辑
      this.setData({
        markers,
        filteredMarkers: this.filterMarkers(markers, this.data.currentFilter)
      });
    } catch (error) {
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    }
  },

  onSearchInput(e) {
    const { value } = e.detail;
    this.setData({ searchKeyword: value });
    this.filterMarkers(this.data.markers, this.data.currentFilter, value);
  },

  onSearch() {
    this.filterMarkers(this.data.markers, this.data.currentFilter, this.data.searchKeyword);
  },

  onRegionChange(e) {
    if (this.data.debounceTimer) {
      clearTimeout(this.data.debounceTimer);
    }

    if (e.type === 'end' && !this.data.isLoading) {
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
    this.filterMarkers(this.data.markers, type, this.data.searchKeyword);
  },

  filterMarkers(markers, filter, keyword = '') {
    let filtered = [...markers];
    
    if (filter !== 'all') {
      filtered = filtered.filter(marker => marker.type === filter);
    }
    
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(marker => 
        marker.name.toLowerCase().includes(lowerKeyword) ||
        marker.description.toLowerCase().includes(lowerKeyword)
      );
    }
    
    this.setData({ filteredMarkers: filtered });
    return filtered;
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
    await this.loadMarkers();
  },

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

  updateMyLocation(latitude, longitude) {
    const app = getApp();
    if (!app.globalData.openid) {
      console.log('用户未登录，无法更新位置');
      app.getOpenid(() => {
        if (app.globalData.openid) {
          this.getLocation();
        }
      });
      return;
    }

    if (!latitude || !longitude) {
      this.getLocation();
      return;
    }
    
    this.getUserInfo().then(userInfo => {
      const db = wx.cloud.database();
      db.collection('user_locations').where({
        _openid: app.globalData.openid
      }).count().then(countRes => {
        if (countRes.total === 0) {
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
              introduction: ''
            }
          }).then(() => {
            console.log('位置信息创建成功');
          }).catch(err => {
            console.error('位置信息创建失败', err);
          });
        } else {
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
      const db = wx.cloud.database();
      db.collection('user_locations').where({
        _openid: app.globalData.openid
      }).count().then(countRes => {
        if (countRes.total === 0) {
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
              introduction: ''
            }
          }).then(() => {
            console.log('位置信息创建成功(默认信息)');
          }).catch(err => {
            console.error('位置信息创建失败', err);
          });
        } else {
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

  getUserInfo() {
    return new Promise((resolve, reject) => {
      const app = getApp();
      if (!app.globalData.openid) {
        console.log('未登录，无法获取用户信息');
        reject(new Error('未登录'));
        return;
      }
      
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

  loadAllUserLocations() {
    console.log('开始加载用户位置');
    const db = wx.cloud.database();
    const _ = db.command;
    const app = getApp();
    
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
    
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
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
      
      const markers = res.data.map((item, index) => {
        const isCurrentUser = item._openid === app.globalData.openid;
        
        if (isCurrentUser) {
          return null;
        }
        
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
            introduction: item.introduction || ''
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

  loadUsersInRegion(southwest, northeast) {
    console.log('开始加载区域内用户', {southwest, northeast});
    
    const now = Date.now();
    
    if (this.data.regionCache.data && 
        now - this.data.regionCache.timestamp < this.CACHE_DURATION &&
        this.isInSameRegion(this.data.regionCache.region, {southwest, northeast})) {
      console.log('使用缓存数据');
      this.processAndUpdateMarkers(this.data.regionCache.data);
      return;
    }

    console.log('开始加载区域内用户', {southwest, northeast});
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const query = {
      visible: true,
      lastUpdateTime: _.gt(oneHourAgo),
      'location.latitude': _.gte(southwest.latitude).and(_.lte(northeast.latitude)),
      'location.longitude': _.gte(southwest.longitude).and(_.lte(northeast.longitude))
    };

    db.collection('user_locations')
      .where(query)
      .limit(50)
      .get()
      .then(res => {
        console.log('获取到用户数据:', res.data);
        
        this.setData({
          'regionCache.data': res.data,
          'regionCache.timestamp': now,
          'regionCache.region': {southwest, northeast}
        });
        
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

  processAndUpdateMarkers(users) {
    const app = getApp();
    const currentMarkers = this.data.markers || [];
    const newMarkers = [];
    const markersMap = new Map();
    
    console.log('开始处理用户数据，总数:', users.length);
    
    currentMarkers.forEach(marker => {
      if (marker.userData) {
        markersMap.set(marker.userData.openid, marker);
      }
    });
    
    users.forEach(user => {
      if (user._openid === app.globalData.openid) {
        console.log('跳过当前用户');
        return;
      }

      const existingMarker = markersMap.get(user._openid);
      if (existingMarker &&
          existingMarker.latitude === user.location.latitude &&
          existingMarker.longitude === user.location.longitude) {
        newMarkers.push(existingMarker);
      } else {
        newMarkers.push({
          id: newMarkers.length + 1,
          latitude: user.location.latitude,
          longitude: user.location.longitude,
          iconPath: user.avatarUrl || '/images/default-avatar.png',
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
            openid: user._openid,
            nickName: user.nickName || '匿名用户',
            avatarUrl: user.avatarUrl || '/images/default-avatar.png',
            introduction: user.introduction || ''
          }
        });
      }
    });

    console.log('处理完成，新标记数量:', newMarkers.length);
    
    if (JSON.stringify(currentMarkers) !== JSON.stringify(newMarkers)) {
      this.setData({ 
        markers: newMarkers,
        filteredMarkers: newMarkers 
      }, () => {
        console.log('标记已更新到地图');
      });
    } else {
      console.log('标记未发生变化，跳过更新');
    }
  },

  isInSameRegion(region1, region2) {
    if (!region1 || !region2) return false;
    const tolerance = 0.01;
    return (
      Math.abs(region1.southwest.latitude - region2.southwest.latitude) < tolerance &&
      Math.abs(region1.southwest.longitude - region2.southwest.longitude) < tolerance &&
      Math.abs(region1.northeast.latitude - region2.northeast.latitude) < tolerance &&
      Math.abs(region1.northeast.longitude - region2.northeast.longitude) < tolerance
    );
  },

  updateUserLocationInfo() {
    const app = getApp();
    if (!app.globalData.openid) {
      console.log('未登录，无法更新用户位置信息');
      return;
    }
    
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

  createCircleAvatar(avatarUrl, index) {
    const ctx = wx.createCanvasContext('avatarCanvas');
    const size = 100;
    const radius = size / 2;
    
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
        
        canvas.width = size;
        canvas.height = size;
        
        ctx.clearRect(0, 0, size, size);
        
        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, Math.PI * 2, false);
        ctx.clip();
        
        const img = canvas.createImage();
        img.src = avatarUrl;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.stroke();
          
          wx.canvasToTempFilePath({
            canvas: canvas,
            success: (res) => {
              console.log('头像圆形化成功', res.tempFilePath);
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

  // 获取位置信息
  getLocation(shouldMove = true) {
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
          
          // 只有在需要时才移动到当前位置
          if (shouldMove) {
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
          } else {
            // 直接获取当前可视区域并加载用户
            mapCtx.getRegion({
              success: (region) => {
                console.log('获取地图区域成功:', region);
                this.loadUsersInRegion(region.southwest, region.northeast);
              }
            });
          }
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
}); 