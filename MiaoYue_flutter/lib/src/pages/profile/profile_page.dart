import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../shared/widgets/circle_avatar.dart';
import '../../services/user_service.dart';
import '../../shared/models/user_model.dart';
import '../../shared/widgets/app_bar.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final UserService _userService = UserService();
  late Future<UserModel> _userFuture;
  final TextEditingController _introController = TextEditingController();
  bool _isEditingIntro = false;

  @override
  void initState() {
    super.initState();
    // 使用缓存数据快速加载页面
    _userFuture = _userService.getCurrentUser();
    
    // 页面显示后，在背景刷新数据
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _refreshUserData();
      }
    });
  }
  
  // 刷新用户数据
  Future<void> _refreshUserData() async {
    try {
      // 强制从网络刷新用户数据
      final freshData = await _userService.getCurrentUser(forceRefresh: true);
      if (mounted) {
        setState(() {
          // 不直接更新 _userFuture，而是让当前数据保持不变，避免UI闪烁
          // 如果数据有变化，会在下次进入页面时显示
        });
      }
    } catch (e) {
      // 安静地处理错误，不打断用户体验
      print('后台刷新用户数据失败: $e');
    }
  }
  
  @override
  void dispose() {
    _introController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<UserModel>(
      future: _userFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            backgroundColor: AppTheme.lightGrey,
            body: const Center(
              child: CircularProgressIndicator(
                color: AppTheme.primaryColor,
              ),
            ),
          );
        }

        if (snapshot.hasError) {
          return Scaffold(
            backgroundColor: AppTheme.lightGrey,
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: AppTheme.errorColor,
                    size: 60,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '加载失败: ${snapshot.error}',
                    style: const TextStyle(color: AppTheme.errorColor),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _userFuture = _userService.getCurrentUser();
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                    ),
                    child: const Text('重试'),
                  ),
                ],
              ),
            ),
          );
        }

        final user = snapshot.data!;
        if (_introController.text.isEmpty && !_isEditingIntro) {
          _introController.text = user.introduction ?? '';
        }
        
        return Scaffold(
          backgroundColor: AppTheme.lightGrey,
          appBar: AppBarWidget(
            title: '个人主页',
            actions: [
              IconButton(
                icon: const Icon(Icons.settings_outlined, color: AppTheme.primaryText),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('设置功能待实现'),
                      backgroundColor: AppTheme.primaryDarkColor,
                    ),
                  );
                },
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _userFuture = _userService.getCurrentUser(forceRefresh: true);
              });
            },
            color: AppTheme.primaryColor,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: const EdgeInsets.all(15),
                child: Column(
                  children: [
                    // 用户信息卡片
                    _buildUserInfoCard(user),
                    
                    // 个人介绍卡片
                    _buildIntroductionCard(user),
                    
                    // 联系方式卡片
                    _buildContactCard(user),
                    
                    // 相册卡片
                    _buildMediaCard(user),
                    
                    // 底部空间，避免被底部导航栏遮挡
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  // 用户信息卡片
  Widget _buildUserInfoCard(UserModel user) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // 用户头像
          GestureDetector(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('修改头像功能待实现'),
                  backgroundColor: AppTheme.primaryDarkColor,
                ),
              );
            },
            child: CustomCircleAvatar(
              imageUrl: user.avatarUrl ?? 'assets/images/avatar.png',
              radius: 30,
            ),
          ),
          const SizedBox(width: 10),
          
          // 用户名和ID
          Expanded(
            child: GestureDetector(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('修改昵称功能待实现'),
                    backgroundColor: AppTheme.primaryDarkColor,
                  ),
                );
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        user.nickname ?? '未设置昵称',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.primaryText,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        user.gender == 'male' ? Icons.male : Icons.female,
                        color: user.gender == 'male' ? Colors.blue : Colors.pink,
                        size: 16,
                      ),
                    ],
                  ),
                  Text(
                    'ID: ${user.id}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.secondaryText,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 个人介绍卡片
  Widget _buildIntroductionCard(UserModel user) {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题栏
          Container(
            padding: const EdgeInsets.only(bottom: 10),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: Color(0xFFF0F0F0),
                  width: 1,
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '个人介绍',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.primaryText,
                  ),
                ),
                _isEditingIntro 
                  ? TextButton(
                      onPressed: () {
                        setState(() {
                          _isEditingIntro = false;
                          // 在这里应该保存到后端
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('保存个人介绍功能待实现'),
                              backgroundColor: AppTheme.primaryDarkColor,
                            ),
                          );
                        });
                      },
                      child: const Text(
                        '保存',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    )
                  : TextButton(
                      onPressed: () {
                        setState(() {
                          _isEditingIntro = true;
                        });
                      },
                      child: const Text(
                        '编辑',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
              ],
            ),
          ),
          
          // 内容区域
          Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              color: _isEditingIntro ? const Color(0xFFF9F9F9) : Colors.white,
              borderRadius: BorderRadius.circular(4),
            ),
            child: TextField(
              controller: _introController,
              enabled: _isEditingIntro,
              maxLines: 3,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.primaryText,
              ),
              decoration: InputDecoration(
                border: InputBorder.none,
                hintText: '点击这里编辑个人介绍',
                hintStyle: TextStyle(
                  fontSize: 14,
                  color: AppTheme.secondaryText.withOpacity(0.7),
                ),
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 联系方式卡片
  Widget _buildContactCard(UserModel user) {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题栏
          Container(
            padding: const EdgeInsets.only(bottom: 10),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: Color(0xFFF0F0F0),
                  width: 1,
                ),
              ),
            ),
            child: Row(
              children: [
                const Text(
                  '联系方式',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.primaryText,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0x1407C160),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    '仅匹配后可见',
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFF07C160),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // 联系方式列表
          _buildContactItem('微信号', user.wechat ?? '未设置'),
          _buildContactItem('手机号', user.phone ?? '未设置'),
        ],
      ),
    );
  }

  Widget _buildContactItem(String label, String value) {
    return InkWell(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('设置$label功能待实现'),
            backgroundColor: AppTheme.primaryDarkColor,
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: Color(0xFFF5F5F5),
              width: 1,
            ),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF666666),
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.primaryText,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 相册卡片
  Widget _buildMediaCard(UserModel user) {
    final List<MediaItem> mediaItems = user.mediaList ?? [];
    
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题栏
          Container(
            padding: const EdgeInsets.only(bottom: 10),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: Color(0xFFF0F0F0),
                  width: 1,
                ),
              ),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '相册',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.primaryText,
                  ),
                ),
              ],
            ),
          ),
          
          // 相册内容
          Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: mediaItems.isEmpty
                ? _buildEmptyMediaUpload() 
                : _buildMediaGrid(mediaItems),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyMediaUpload() {
    return InkWell(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('上传照片功能待实现'),
            backgroundColor: AppTheme.primaryDarkColor,
          ),
        );
      },
      child: Container(
        width: double.infinity,
        height: 150,
        decoration: BoxDecoration(
          color: const Color(0xFFF9F9F9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: const Color(0xFFE0E0E0),
                  width: 1,
                ),
              ),
              child: const Icon(
                Icons.add,
                color: Color(0xFF666666),
                size: 24,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '添加照片或视频',
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF666666),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMediaGrid(List<MediaItem> mediaItems) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 1,
      ),
      itemCount: mediaItems.length + 1, // +1 for the add button
      itemBuilder: (context, index) {
        if (index == mediaItems.length) {
          // Add button
          return InkWell(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('上传照片功能待实现'),
                  backgroundColor: AppTheme.primaryDarkColor,
                ),
              );
            },
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF9F9F9),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.add,
                    color: Color(0xFF666666),
                    size: 24,
                  ),
                  SizedBox(height: 4),
                  Text(
                    '添加',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF666666),
                    ),
                  ),
                ],
              ),
            ),
          );
        } else {
          // Media item
          final MediaItem media = mediaItems[index];
          final String imageUrl = media.type == 'video' && media.thumbUrl != null 
              ? media.thumbUrl! 
              : media.fileID;
          
          return Stack(
            children: [
              InkWell(
                onTap: () {
                  // Preview image
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('预览照片功能待实现'),
                      backgroundColor: AppTheme.primaryDarkColor,
                    ),
                  );
                },
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(4),
                    image: DecorationImage(
                      image: NetworkImage(imageUrl),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: media.type == 'video' 
                      ? const Center(
                          child: Icon(
                            Icons.play_circle_outline,
                            color: Colors.white,
                            size: 36,
                          ),
                        ) 
                      : null,
                ),
              ),
              // Delete button
              Positioned(
                top: 2,
                right: 2,
                child: InkWell(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('删除照片功能待实现'),
                        backgroundColor: AppTheme.primaryDarkColor,
                      ),
                    );
                  },
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.close,
                      color: Colors.white,
                      size: 14,
                    ),
                  ),
                ),
              ),
            ],
          );
        }
      },
    );
  }
} 