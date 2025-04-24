import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../models/post_model.dart';
import 'circle_avatar.dart';

class PostCard extends StatelessWidget {
  final PostModel post;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onShare;

  const PostCard({
    super.key,
    required this.post,
    required this.onLike,
    required this.onComment,
    required this.onShare,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: const BoxDecoration(
        color: Colors.white,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 帖子头部：用户信息
          _buildPostHeader(context),
          
          // 帖子内容
          if (post.content.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Text(
                post.content,
                style: const TextStyle(
                  fontSize: 15,
                  color: AppTheme.primaryText,
                ),
              ),
            ),
          
          // 帖子图片
          if (post.imageUrls.isNotEmpty)
            _buildImageGallery(),
          
          // 帖子位置信息
          if (post.location != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 16,
                    color: AppTheme.secondaryText,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    post.location!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.secondaryText,
                    ),
                  ),
                ],
              ),
            ),
          
          // 帖子底部：点赞、评论、分享按钮
          _buildPostActions(),
          
          // 帖子统计信息：点赞数、评论数
          _buildPostStats(),
          
          const Divider(height: 1),
        ],
      ),
    );
  }

  Widget _buildPostHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // 用户头像
          CustomCircleAvatar(
            imageUrl: post.author.avatarUrl,
            radius: 20,
          ),
          const SizedBox(width: 12),
          // 用户名和发布时间
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.author.nickName ?? '匿名用户',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryText,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _formatPostTime(post.createdAt),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.secondaryText,
                  ),
                ),
              ],
            ),
          ),
          // 更多操作按钮
          IconButton(
            icon: const Icon(Icons.more_horiz, color: AppTheme.darkGrey),
            onPressed: () {
              // 显示更多操作菜单
            },
          ),
        ],
      ),
    );
  }

  Widget _buildImageGallery() {
    // 根据图片数量确定布局方式
    if (post.imageUrls.length == 1) {
      // 单张图片显示
      return _buildSingleImage(post.imageUrls[0]);
    } else if (post.imageUrls.length <= 3) {
      // 2-3张图片显示
      return _buildRowImages(post.imageUrls);
    } else {
      // 4-9张图片显示
      return _buildGridImages(post.imageUrls);
    }
  }

  Widget _buildSingleImage(String imageUrl) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: _buildImage(imageUrl),
        ),
      ),
    );
  }

  Widget _buildRowImages(List<String> imageUrls) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: imageUrls.map((url) {
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.only(right: 4),
              child: AspectRatio(
                aspectRatio: 1,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: _buildImage(url),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildGridImages(List<String> imageUrls) {
    final int rows = (imageUrls.length / 3).ceil();
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: List.generate(rows, (rowIndex) {
          final int startIndex = rowIndex * 3;
          final int endIndex = (startIndex + 3) <= imageUrls.length 
              ? startIndex + 3 
              : imageUrls.length;
          
          return Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              children: List.generate(endIndex - startIndex, (index) {
                final int actualIndex = startIndex + index;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: index < 2 ? 4 : 0),
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: _buildImage(imageUrls[actualIndex]),
                      ),
                    ),
                  ),
                );
              }),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildImage(String imageUrl) {
    final bool isAssetImage = imageUrl.startsWith('assets/');
    
    if (isAssetImage) {
      return Image.asset(
        imageUrl,
        fit: BoxFit.cover,
      );
    } else {
      return Image.network(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            color: Colors.grey[300],
            child: const Icon(Icons.broken_image, color: Colors.white),
          );
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Center(
            child: CircularProgressIndicator(
              value: loadingProgress.expectedTotalBytes != null
                  ? loadingProgress.cumulativeBytesLoaded / 
                      loadingProgress.expectedTotalBytes!
                  : null,
              color: AppTheme.primaryColor,
            ),
          );
        },
      );
    }
  }

  Widget _buildPostActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // 点赞按钮
          _buildActionButton(
            icon: post.isLiked 
                ? Icons.favorite 
                : Icons.favorite_border,
            color: post.isLiked ? Colors.red : null,
            label: '点赞',
            onTap: onLike,
          ),
          // 评论按钮
          _buildActionButton(
            icon: Icons.chat_bubble_outline,
            label: '评论',
            onTap: onComment,
          ),
          // 分享按钮
          _buildActionButton(
            icon: Icons.share_outlined,
            label: '分享',
            onTap: onShare,
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        child: Row(
          children: [
            Icon(
              icon, 
              size: 20, 
              color: color ?? AppTheme.darkGrey,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: color ?? AppTheme.darkGrey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPostStats() {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
      child: Text(
        '${post.likesCount} 点赞 · ${post.commentsCount} 评论',
        style: const TextStyle(
          fontSize: 12,
          color: AppTheme.secondaryText,
        ),
      ),
    );
  }

  String _formatPostTime(DateTime dateTime) {
    final DateTime now = DateTime.now();
    final Duration difference = now.difference(dateTime);
    
    if (difference.inMinutes < 1) {
      return '刚刚';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}分钟前';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}小时前';
    } else if (difference.inDays < 30) {
      return '${difference.inDays}天前';
    } else {
      return '${dateTime.month}月${dateTime.day}日';
    }
  }
} 