class LocationService {
  // 模拟获取当前位置
  Future<Map<String, double>> getCurrentLocation() async {
    // 在真实环境中，这里会调用位置相关API获取实际位置
    await Future.delayed(const Duration(seconds: 1));
    
    // 上海市人民广场坐标
    return {
      'latitude': 31.2304,
      'longitude': 121.4737,
    };
  }

  // 模拟获取附近的用户
  Future<List<Map<String, dynamic>>> getNearbyUsers() async {
    // 在真实环境中，这里会从API获取附近用户数据
    await Future.delayed(const Duration(seconds: 1));
    
    return [
      {
        'id': 'user1',
        'name': '用户A',
        'avatar': 'https://via.placeholder.com/50/FF5733',
        'latitude': 31.2324,
        'longitude': 121.4727,
        'distance': 0.3, // 单位: km
      },
      {
        'id': 'user2',
        'name': '用户B',
        'avatar': 'https://via.placeholder.com/50/33FFCC',
        'latitude': 31.2294,
        'longitude': 121.4757,
        'distance': 0.5, // 单位: km
      },
      {
        'id': 'user3',
        'name': '用户C',
        'avatar': 'https://via.placeholder.com/50/3366FF',
        'latitude': 31.2274,
        'longitude': 121.4700,
        'distance': 0.8, // 单位: km
      },
    ];
  }

  // 模拟更新用户位置
  Future<bool> updateUserLocation(double latitude, double longitude) async {
    // 在真实环境中，这里会将用户位置发送到API
    await Future.delayed(const Duration(seconds: 1));
    return true;
  }
} 