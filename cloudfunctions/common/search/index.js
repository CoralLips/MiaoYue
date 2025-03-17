// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  const $ = db.command.aggregate

  const { 
    region,    // 地图可视区域
    keyword,   // 搜索关键词
    types,     // 搜索类型数组：['users', 'business', 'events']
    scale      // 地图当前缩放级别
  } = event

  try {
    // 构建地理位置查询条件
    const geoQuery = {
      location: _.geoWithin({
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [region.southwest.longitude, region.southwest.latitude],
            [region.northeast.longitude, region.southwest.latitude],
            [region.northeast.longitude, region.northeast.latitude],
            [region.southwest.longitude, region.northeast.latitude],
            [region.southwest.longitude, region.southwest.latitude]
          ]]
        }
      })
    }

    // 构建关键词查询条件
    const keywordQuery = keyword ? {
      tags: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    } : {}

    // 构建类型查询条件
    const typeQuery = types && types.length > 0 ? {
      type: _.in(types)
    } : {}

    // 合并查询条件
    const query = {
      ...geoQuery,
      ...keywordQuery,
      ...typeQuery
    }

    // 根据缩放级别决定是否需要聚合
    if (scale <= 12) { // 城市级别，返回聚合数据
      const result = await db.collection('user_locations')
        .aggregate()
        .match(query)
        .group({
          _id: {
            type: '$type',
            region: $.geoNear({
              distanceField: 'distance',
              spherical: true,
              near: region.center,
              maxDistance: 5000, // 5公里内聚合
            })
          },
          count: $.sum(1),
          items: $.push({
            _id: '$_id',
            location: '$location',
            type: '$type',
            tags: '$tags'
          })
        })
        .end()
      
      return {
        success: true,
        data: result.list,
        type: 'clustered'
      }
    } else { // 详细级别，返回具体标记点
      const result = await db.collection('user_locations')
        .where(query)
        .limit(100) // 限制返回数量
        .get()
      
      return {
        success: true,
        data: result.data,
        type: 'detailed'
      }
    }
  } catch (err) {
    console.error('搜索失败:', err)
    return {
      success: false,
      error: err
    }
  }
} 