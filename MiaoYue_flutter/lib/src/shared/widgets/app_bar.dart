import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// 统一风格的应用栏组件，固定在顶部
class AppBarWidget extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final bool centerTitle;
  final double elevation;
  final Color backgroundColor;
  final Color titleColor;
  final double titleFontSize;
  final FontWeight titleFontWeight;

  const AppBarWidget({
    super.key,
    required this.title,
    this.actions,
    this.centerTitle = true,
    this.elevation = 0,
    this.backgroundColor = AppTheme.wechatBarGrey,
    this.titleColor = AppTheme.primaryText,
    this.titleFontSize = 17,
    this.titleFontWeight = FontWeight.bold,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: backgroundColor,
      elevation: elevation,
      centerTitle: centerTitle,
      title: Text(
        title,
        style: TextStyle(
          color: titleColor,
          fontWeight: titleFontWeight,
          fontSize: titleFontSize,
        ),
      ),
      actions: actions,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

/// 用于滚动视图中的应用栏组件
class SliverAppBarWidget extends StatelessWidget {
  final String title;
  final List<Widget>? actions;
  final bool centerTitle;
  final double elevation;
  final Color backgroundColor;
  final Color titleColor;
  final double titleFontSize;
  final FontWeight titleFontWeight;
  final bool floating;
  final bool pinned;
  final double expandedHeight;

  const SliverAppBarWidget({
    super.key,
    required this.title,
    this.actions,
    this.centerTitle = true,
    this.elevation = 0,
    this.backgroundColor = AppTheme.wechatBarGrey,
    this.titleColor = AppTheme.primaryText,
    this.titleFontSize = 17,
    this.titleFontWeight = FontWeight.bold,
    this.floating = true,
    this.pinned = true,
    this.expandedHeight = 0,
  });

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      backgroundColor: backgroundColor,
      elevation: elevation,
      centerTitle: centerTitle,
      floating: floating,
      pinned: pinned,
      expandedHeight: expandedHeight,
      title: Text(
        title,
        style: TextStyle(
          color: titleColor,
          fontWeight: titleFontWeight,
          fontSize: titleFontSize,
        ),
      ),
      actions: actions,
    );
  }
} 