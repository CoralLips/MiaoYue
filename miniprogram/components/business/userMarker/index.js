Component({
  properties: {
    // 用户头像URL
    avatarUrl: {
      type: String,
      value: ''
    },
    // 用户昵称
    nickName: {
      type: String,
      value: '匿名用户'
    },
    // 标记位置
    latitude: {
      type: Number,
      value: 0
    },
    longitude: {
      type: Number,
      value: 0
    },
    // 是否显示昵称
    showNickname: {
      type: Boolean,
      value: true
    },
    // 用户数据
    userData: {
      type: Object,
      value: null
    },
    // 地图上下文ID
    mapId: {
      type: String,
      value: 'map'
    }
  },

  data: {
    // 图片加载状态
    imageLoaded: false,
    // 默认头像
    defaultAvatar: '/images/default-avatar.png',
    // 屏幕坐标
    x: 0,
    y: 0,
    // 是否显示标记
    show: false
  },

  lifetimes: {
    attached() {
      this.mapContext = wx.createMapContext(this.properties.mapId);
      this.updatePosition();
    },
    
    detached() {
      if (this.positionUpdateTimer) {
        clearTimeout(this.positionUpdateTimer);
      }
    }
  },

  methods: {
    // 更新标记位置
    updatePosition() {
      if (!this.mapContext) return;
      
      this.mapContext.fromLatLngToPoint({
        latitude: this.properties.latitude,
        longitude: this.properties.longitude,
        success: (point) => {
          if (point && typeof point.x === 'number' && typeof point.y === 'number') {
            this.setData({
              show: true,
              x: point.x,
              y: point.y
            });
          } else {
            this.setData({ show: false });
          }
        },
        fail: (err) => {
          console.error('坐标转换失败', err);
          this.setData({ show: false });
        }
      });
    },

    // 处理图片加载完成
    onImageLoad() {
      this.setData({
        imageLoaded: true
      });
    },

    // 处理图片加载失败
    onImageError() {
      this.setData({
        avatarUrl: this.data.defaultAvatar
      });
    },

    // 处理标记点击
    onMarkerTap() {
      this.triggerEvent('markertap', {
        latitude: this.properties.latitude,
        longitude: this.properties.longitude,
        userData: this.properties.userData || {
          nickName: this.properties.nickName,
          avatarUrl: this.properties.avatarUrl
        }
      });
    }
  },

  observers: {
    'latitude, longitude': function() {
      this.updatePosition();
    }
  }
}); 