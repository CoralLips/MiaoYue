import 'package:flutter/material.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/widgets/custom_card.dart';

class MediaGallery extends StatelessWidget {
  final List<MediaItem>? mediaList;
  final VoidCallback onAdd;
  final Function(int) onPreview;
  final Function(int) onDelete;

  const MediaGallery({
    super.key,
    this.mediaList,
    required this.onAdd,
    required this.onPreview,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return CustomCard(
      title: '相册',
      child: mediaList == null || mediaList!.isEmpty
          ? _buildEmptyGallery()
          : _buildGalleryGrid(),
    );
  }

  Widget _buildEmptyGallery() {
    return GestureDetector(
      onTap: onAdd,
      child: Container(
        height: 150,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.add, size: 48, color: Colors.grey),
            SizedBox(height: 8),
            Text(
              '添加照片或视频',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGalleryGrid() {
    return Column(
      children: [
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: mediaList!.length + 1, // +1 为了添加按钮
          itemBuilder: (context, index) {
            if (index == mediaList!.length) {
              // 最后一个位置显示添加按钮
              return _buildAddButton();
            } else {
              // 显示媒体内容
              return _buildMediaItem(index);
            }
          },
        ),
      ],
    );
  }

  Widget _buildAddButton() {
    return GestureDetector(
      onTap: onAdd,
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(Icons.add, color: Colors.grey),
      ),
    );
  }

  Widget _buildMediaItem(int index) {
    final MediaItem media = mediaList![index];
    final bool isVideo = media.type == 'video';
    final bool isAsset = media.fileID.startsWith('assets/');

    return GestureDetector(
      onTap: () => onPreview(index),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 媒体内容
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: isAsset
                ? Image.asset(
                    isVideo ? (media.thumbUrl ?? '') : media.fileID,
                    fit: BoxFit.cover,
                  )
                : Image.network(
                    isVideo ? (media.thumbUrl ?? '') : media.fileID,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey[300],
                        child: const Icon(Icons.broken_image, color: Colors.white),
                      );
                    },
                  ),
          ),
          // 视频图标
          if (isVideo)
            const Positioned.fill(
              child: Center(
                child: Icon(
                  Icons.play_circle_outline,
                  color: Colors.white,
                  size: 36,
                ),
              ),
            ),
          // 删除按钮
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: () => onDelete(index),
              child: Container(
                width: 24,
                height: 24,
                decoration: const BoxDecoration(
                  color: Colors.black45,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.close,
                  color: Colors.white,
                  size: 16,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
} 