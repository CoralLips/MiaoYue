// 全局常量配置
module.exports = {
  // 缓存相关
  CACHE: {
    USER_INFO: 'user_info',
    LOCATION: 'location',
    SETTINGS: 'settings',
    EXPIRE_TIME: {
      SHORT: 5 * 60 * 1000, // 5分钟
      MEDIUM: 30 * 60 * 1000, // 30分钟
      LONG: 24 * 60 * 60 * 1000 // 1天
    }
  },

  // 事件名称
  EVENTS: {
    USER_INFO_UPDATED: 'userInfoUpdated',
    LOCATION_UPDATED: 'locationUpdated',
    REFRESH_NEEDED: 'refreshNeeded'
  },

  // 页面路径
  PAGES: {
    INDEX: '/pages/index/index',
    DISCOVER: '/pages/discover/index',
    PROFILE: '/pages/profile/index',
    USER_DETAIL: '/packageUser/pages/user/detail/index',
    VIDEO_PLAYER: '/packageMedia/pages/video-player/index'
  },

  // API接口地址
  API: {
    BASE_URL: 'https://api.example.com',
    ENDPOINTS: {
      USER: '/user',
      LOCATION: '/location',
      MEDIA: '/media'
    }
  },

  // 默认值
  DEFAULTS: {
    AVATAR: '/images/default-avatar.png',
    NICKNAME: '未知用户',
    LOCATION: {
      latitude: 39.9042,
      longitude: 116.4074
    }
  },

  // 正则表达式
  REGEX: {
    PHONE: /^1[3-9]\d{9}$/,
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  }
}; 