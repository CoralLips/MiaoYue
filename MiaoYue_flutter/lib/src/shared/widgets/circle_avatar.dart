import 'package:flutter/material.dart';

class CustomCircleAvatar extends StatelessWidget {
  final String? imageUrl;
  final double radius;
  final VoidCallback? onTap;
  final String placeholder;

  const CustomCircleAvatar({
    super.key,
    this.imageUrl,
    this.radius = 40,
    this.onTap,
    this.placeholder = 'assets/images/avatar.png',
  });

  @override
  Widget build(BuildContext context) {
    final Widget avatar = CircleAvatar(
      radius: radius,
      backgroundColor: Colors.grey[200],
      backgroundImage: _getBackgroundImage(),
      child: _getChild(),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: avatar,
      );
    }

    return avatar;
  }

  ImageProvider? _getBackgroundImage() {
    if (_isNullOrEmpty(imageUrl)) {
      return AssetImage(placeholder);
    }

    if (imageUrl!.startsWith('assets/')) {
      return AssetImage(imageUrl!);
    } else if (imageUrl!.startsWith('http')) {
      return NetworkImage(imageUrl!);
    }

    return AssetImage(placeholder);
  }

  Widget? _getChild() {
    if (_isNullOrEmpty(imageUrl)) {
      return null; // 使用占位图而不是图标
    }
    return null;
  }

  bool _isNullOrEmpty(String? str) {
    return str == null || str.isEmpty;
  }
} 