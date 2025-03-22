/**
 * 应用常量定义
 */

// TabBar页面索引
const TAB_BAR_ITEMS = {
  HOME: 0,
  DISCOVER: 1,
  PROFILE: 2
  // 可根据实际TabBar项添加更多...
};

// 缓存时间设置（毫秒）
const CACHE_DURATION = {
  MAP_USERS: 60000, // 地图用户数据缓存60秒
};

module.exports = {
  TAB_BAR_ITEMS,
  CACHE_DURATION
}; 