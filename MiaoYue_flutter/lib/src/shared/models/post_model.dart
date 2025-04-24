import '../models/user_model.dart';

class PostModel {
  final String id;
  final String content;
  final List<String> imageUrls;
  final UserModel author;
  final DateTime createdAt;
  final int likesCount;
  final int commentsCount;
  final bool isLiked;
  final String? location;

  PostModel({
    required this.id,
    required this.content,
    required this.imageUrls,
    required this.author,
    required this.createdAt,
    required this.likesCount,
    required this.commentsCount,
    required this.isLiked,
    this.location,
  });

  // 复制方法，允许修改特定字段并返回新实例
  PostModel copyWith({
    String? id,
    String? content,
    List<String>? imageUrls,
    UserModel? author,
    DateTime? createdAt,
    int? likesCount,
    int? commentsCount,
    bool? isLiked,
    String? location,
  }) {
    return PostModel(
      id: id ?? this.id,
      content: content ?? this.content,
      imageUrls: imageUrls ?? this.imageUrls,
      author: author ?? this.author,
      createdAt: createdAt ?? this.createdAt,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      isLiked: isLiked ?? this.isLiked,
      location: location ?? this.location,
    );
  }
} 