import 'package:flutter/material.dart';
import '../../services/location_service.dart';
import 'components/search_bar.dart';
import 'components/map_controls.dart';
import '../../config/theme.dart';
import '../../shared/widgets/app_bar.dart';

class ExplorePage extends StatefulWidget {
  const ExplorePage({super.key});

  @override
  State<ExplorePage> createState() => _ExplorePageState();
}

class _ExplorePageState extends State<ExplorePage> {
  final LocationService _locationService = LocationService();
  
  // 模拟地图控制器
  // 在实际项目中，这里应该使用 google_maps_flutter 包中的 GoogleMapController
  // 当前为了演示，我们只创建一个模拟界面
  
  // 当前位置
  double latitude = 31.2304;
  double longitude = 121.4737;
  // 地图缩放级别
  double mapScale = 14.0;
  // 标记点列表
  List<Map<String, dynamic>> nearbyUsers = [];
  
  // 搜索关键词
  String searchKeyword = '';
  
  // 刷新状态
  bool isRefreshing = false;
  
  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }
  
  Future<void> _loadInitialData() async {
    final location = await _locationService.getCurrentLocation();
    final users = await _locationService.getNearbyUsers();
    
    if (mounted) {
      setState(() {
        latitude = location['latitude']!;
        longitude = location['longitude']!;
        nearbyUsers = users;
      });
    }
  }
  
  void _onSearch(String value) {
    setState(() {
      searchKeyword = value;
    });
    // 在实际项目中，这里应该根据关键词过滤地图上的标记点
  }
  
  void _onRefresh() async {
    setState(() {
      isRefreshing = true;
    });
    
    // 模拟刷新操作
    await Future.delayed(const Duration(milliseconds: 500));
    final users = await _locationService.getNearbyUsers();
    
    if (mounted) {
      setState(() {
        nearbyUsers = users;
        isRefreshing = false;
      });
    }
  }
  
  void _onMoveToCurrentLocation() async {
    final location = await _locationService.getCurrentLocation();
    
    if (mounted) {
      setState(() {
        latitude = location['latitude']!;
        longitude = location['longitude']!;
      });
    }
    
    // 在实际项目中，这里应该调用地图控制器移动到当前位置
  }
  
  void _onFilter() {
    // 在实际项目中，这里应该显示过滤菜单
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('过滤功能待实现'),
        backgroundColor: AppTheme.primaryDarkColor,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBarWidget(
        title: '发现',
      ),
      body: Stack(
        children: [
          // 地图区域
          Container(
            width: double.infinity,
            height: double.infinity,
            color: Colors.grey[200],
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    '地图区域',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  Text('当前位置: $latitude, $longitude'),
                  const SizedBox(height: 8),
                  Text('附近用户: ${nearbyUsers.length}人'),
                  const SizedBox(height: 16),
                  if (searchKeyword.isNotEmpty)
                    Text('搜索关键词: $searchKeyword'),
                ],
              ),
            ),
          ),
          
          // 搜索栏
          Positioned(
            top: 20, // 顶部间距调整，因为现在有标准AppBar
            left: 16,
            right: 16,
            child: CustomSearchBar(
              onSearch: _onSearch,
            ),
          ),
          
          // 地图控制按钮
          Positioned(
            right: 16,
            bottom: 100,
            child: MapControls(
              onRefresh: _onRefresh,
              onLocation: _onMoveToCurrentLocation,
              onFilter: _onFilter,
              isRefreshing: isRefreshing,
            ),
          ),
        ],
      ),
    );
  }
} 