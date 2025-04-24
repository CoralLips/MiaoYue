import 'package:flutter/material.dart';

class CustomCard extends StatelessWidget {
  final Widget child;
  final String? title;
  final EdgeInsets padding;
  final EdgeInsets margin;
  final Color backgroundColor;
  final double borderRadius;
  final Widget? trailing;

  const CustomCard({
    super.key,
    required this.child,
    this.title,
    this.padding = const EdgeInsets.all(16.0),
    this.margin = const EdgeInsets.all(8.0),
    this.backgroundColor = Colors.white,
    this.borderRadius = 8.0,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) _buildHeader(),
          Padding(
            padding: title != null 
                ? EdgeInsets.only(
                    left: padding.left,
                    right: padding.right,
                    bottom: padding.bottom,
                  )
                : padding,
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: EdgeInsets.only(
        left: padding.left,
        right: padding.right,
        top: padding.top,
        bottom: 8.0,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title!,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
} 