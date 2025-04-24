import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/post_service.dart';
import '../../shared/models/post_model.dart';
import '../../shared/widgets/post_card.dart';
import '../../shared/widgets/app_bar.dart';
import '../../shared/widgets/sliver_app_bar_widget.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final PostService _postService = PostService();
  final List<PostModel> _posts = [];
  bool _isLoading = false;
  bool _hasMore = true;
  final ScrollController _scrollController = ScrollController();
  
  @override
  void initState() {
    super.initState();
    _loadPosts();
    _scrollController.addListener(_onScroll);
  }
  
  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
  
  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent * 0.8 && 
        !_isLoading && 
        _hasMore) {
      _loadPosts();
    }
  }
  
  Future<void> _loadPosts() async {
    if (_isLoading) return;
    
    if (mounted) {
      setState(() {
        _isLoading = true;
      });
    }
    
    try {
      final newPosts = await _postService.getFeedPosts(_posts.length);
      
      if (mounted) {
        setState(() {
          if (newPosts.isEmpty) {
            _hasMore = false;
          } else {
            _posts.addAll(newPosts);
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('加载失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  Future<void> _refreshFeed() async {
    if (mounted) {
      setState(() {
        _posts.clear();
        _hasMore = true;
      });
    }
    await _loadPosts();
    return;
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightGrey,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // App Bar
          SliverAppBarWidget(
            title: '首页',
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, color: AppTheme.primaryText),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('通知功能待实现'),
                      backgroundColor: AppTheme.primaryDarkColor,
                    ),
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.search, color: AppTheme.primaryText),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('搜索功能待实现'),
                      backgroundColor: AppTheme.primaryDarkColor,
                    ),
                  );
                },
              ),
            ],
          ),
          
          // Post filters
          SliverToBoxAdapter(
            child: _buildFilterSection(),
          ),
          
          // Posts
          _posts.isEmpty && !_isLoading
              ? const SliverFillRemaining(
                  child: Center(
                    child: Text(
                      '没有发现任何内容\n下拉刷新试试吧',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.tertiaryText,
                        fontSize: 16,
                      ),
                    ),
                  ),
                )
              : SliverPadding(
                  padding: const EdgeInsets.only(bottom: 80),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        if (index < _posts.length) {
                          return PostCard(
                            post: _posts[index],
                            onLike: () {
                              if (mounted) {
                                final updatedPost = _posts[index].copyWith(
                                  isLiked: !_posts[index].isLiked,
                                  likesCount: _posts[index].isLiked
                                      ? _posts[index].likesCount - 1
                                      : _posts[index].likesCount + 1,
                                );
                                
                                setState(() {
                                  _posts[index] = updatedPost;
                                });
                                
                                _postService.likePost(_posts[index].id, !_posts[index].isLiked);
                              }
                            },
                            onComment: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('评论功能待实现'),
                                  backgroundColor: AppTheme.primaryDarkColor,
                                ),
                              );
                            },
                            onShare: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('分享功能待实现'),
                                  backgroundColor: AppTheme.primaryDarkColor,
                                ),
                              );
                            },
                          );
                        } else if (_hasMore) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: CircularProgressIndicator(
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          );
                        } else {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: Text(
                                '没有更多内容了',
                                style: TextStyle(
                                  color: AppTheme.tertiaryText, 
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          );
                        }
                      },
                      childCount: _posts.length + (_hasMore ? 1 : 1),
                    ),
                  ),
                ),
        ],
      ),
      // 添加发布按钮
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primaryColor,
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('发布功能待实现'),
              backgroundColor: AppTheme.primaryDarkColor,
            ),
          );
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
  
  Widget _buildFilterSection() {
    return Container(
      height: 50,
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _buildFilterButton('推荐', true),
          const SizedBox(width: 16),
          _buildFilterButton('关注', false),
          const SizedBox(width: 16),
          _buildFilterButton('附近', false),
        ],
      ),
    );
  }
  
  Widget _buildFilterButton(String label, bool isActive) {
    return InkWell(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$label过滤功能待实现'),
            backgroundColor: AppTheme.primaryDarkColor,
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primaryColor.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: isActive 
              ? Border.all(color: AppTheme.primaryColor, width: 1) 
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? AppTheme.primaryColor : AppTheme.secondaryText,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
} 