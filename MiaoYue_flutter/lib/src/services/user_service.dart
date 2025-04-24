import '../shared/models/user_model.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class UserService {
  // 内存缓存
  UserModel? _cachedUser;
  DateTime? _lastFetchTime;
  
  // 缓存过期时间（12小时）
  final Duration _cacheExpiration = const Duration(hours: 12);
  
  // 缓存键名
  static const String _userCacheKey = 'user_profile';
  static const String _userCacheTimeKey = 'user_cache_time';
  
  // 模拟获取用户信息
  Future<UserModel> getUserProfile() async {
    // 在真实环境中，这里会从API获取数据
    await Future.delayed(const Duration(milliseconds: 300)); // 减少延迟时间
    
    return UserModel(
      id: 'user123',
      nickName: '喵月用户',
      avatarUrl: null, // 使用本地占位图
      introduction: '这是一个示例用户介绍，请编辑此内容来介绍自己。',
      wechat: 'miaoyue123',
      phone: '13800138000',
      mediaList: [
        MediaItem(
          fileID: 'assets/images/placeholder1.png',
          type: 'image',
        ),
        MediaItem(
          fileID: 'assets/images/placeholder2.png',
          type: 'image',
        ),
      ],
    );
  }
  
  // 获取当前登录用户信息，带缓存机制
  Future<UserModel> getCurrentUser({bool forceRefresh = false}) async {
    // 1. 检查内存缓存
    if (!forceRefresh && _cachedUser != null && _lastFetchTime != null) {
      final now = DateTime.now();
      if (now.difference(_lastFetchTime!) < _cacheExpiration) {
        print('使用内存缓存的用户数据');
        return _cachedUser!;
      }
    }
    
    // 2. 检查持久化缓存
    if (!forceRefresh) {
      final prefs = await SharedPreferences.getInstance();
      final cachedUserJson = prefs.getString(_userCacheKey);
      final lastFetchTimeMs = prefs.getInt(_userCacheTimeKey);
      
      if (cachedUserJson != null && lastFetchTimeMs != null) {
        final cachedFetchTime = DateTime.fromMillisecondsSinceEpoch(lastFetchTimeMs);
        if (DateTime.now().difference(cachedFetchTime) < _cacheExpiration) {
          try {
            _cachedUser = UserModel.fromJson(jsonDecode(cachedUserJson));
            _lastFetchTime = cachedFetchTime;
            print('使用持久化缓存的用户数据');
            return _cachedUser!;
          } catch (e) {
            print('解析缓存数据出错: $e');
            // 解析出错时，继续从网络加载
          }
        }
      }
    }
    
    // 3. 从网络加载
    print('从网络加载用户数据');
    final user = await getUserProfile();
    
    // 4. 更新缓存
    _updateCache(user);
    
    return user;
  }

  // 更新缓存
  Future<void> _updateCache(UserModel user) async {
    // 更新内存缓存
    _cachedUser = user;
    _lastFetchTime = DateTime.now();
    
    // 更新持久化缓存
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userCacheKey, jsonEncode(user.toJson()));
      await prefs.setInt(_userCacheTimeKey, _lastFetchTime!.millisecondsSinceEpoch);
      print('用户数据已缓存');
    } catch (e) {
      print('缓存用户数据出错: $e');
    }
  }
  
  // 清除缓存
  Future<void> clearCache() async {
    _cachedUser = null;
    _lastFetchTime = null;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userCacheKey);
    await prefs.remove(_userCacheTimeKey);
    print('用户缓存已清除');
  }

  // 模拟更新用户信息
  Future<UserModel> updateUserProfile(UserModel user) async {
    // 在真实环境中，这里会将数据发送到API
    await Future.delayed(const Duration(milliseconds: 300)); // 减少延迟时间
    
    // 更新缓存
    _updateCache(user);
    
    return user;
  }

  // 模拟更新用户头像
  Future<String> updateAvatar(String imagePath) async {
    // 在真实环境中，这里会上传图片到服务器并获取URL
    await Future.delayed(const Duration(milliseconds: 300)); // 减少延迟时间
    
    // 这里应该更新用户信息缓存，但需要完整的用户信息
    if (_cachedUser != null) {
      final updatedUser = _cachedUser!.copyWith(avatarUrl: 'assets/images/placeholder3.png');
      _updateCache(updatedUser);
    }
    
    return 'assets/images/placeholder3.png';
  }

  // 模拟添加媒体文件
  Future<MediaItem> addMedia(String filePath, String type) async {
    // 在真实环境中，这里会上传文件到服务器并获取URL
    await Future.delayed(const Duration(milliseconds: 300)); // 减少延迟时间
    
    MediaItem newMedia;
    if (type == 'image') {
      newMedia = MediaItem(
        fileID: 'assets/images/placeholder4.png',
        type: 'image',
      );
    } else {
      newMedia = MediaItem(
        fileID: 'assets/images/video.mp4',
        type: 'video',
        thumbUrl: 'assets/images/placeholder5.png',
      );
    }
    
    // 更新用户媒体列表缓存
    if (_cachedUser != null && _cachedUser!.mediaList != null) {
      final updatedMediaList = [..._cachedUser!.mediaList!, newMedia];
      final updatedUser = _cachedUser!.copyWith(mediaList: updatedMediaList);
      _updateCache(updatedUser);
    }
    
    return newMedia;
  }

  // 模拟删除媒体文件
  Future<bool> deleteMedia(String fileID) async {
    // 在真实环境中，这里会从服务器删除文件
    await Future.delayed(const Duration(milliseconds: 300)); // 减少延迟时间
    
    // 更新用户媒体列表缓存
    if (_cachedUser != null && _cachedUser!.mediaList != null) {
      final updatedMediaList = _cachedUser!.mediaList!
          .where((media) => media.fileID != fileID)
          .toList();
      final updatedUser = _cachedUser!.copyWith(mediaList: updatedMediaList);
      _updateCache(updatedUser);
    }
    
    return true;
  }
} 