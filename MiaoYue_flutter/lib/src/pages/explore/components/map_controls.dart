import 'package:flutter/material.dart';

class MapControls extends StatelessWidget {
  final VoidCallback onRefresh;
  final VoidCallback onLocation;
  final VoidCallback onFilter;
  final bool isRefreshing;

  const MapControls({
    super.key,
    required this.onRefresh,
    required this.onLocation,
    required this.onFilter,
    this.isRefreshing = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildButton(
            icon: Icons.filter_list,
            onTap: onFilter,
          ),
          const Divider(height: 1),
          _buildButton(
            icon: Icons.refresh,
            onTap: onRefresh,
            isRotating: isRefreshing,
          ),
          const Divider(height: 1),
          _buildButton(
            icon: Icons.my_location,
            onTap: onLocation,
          ),
        ],
      ),
    );
  }

  Widget _buildButton({
    required IconData icon,
    required VoidCallback onTap,
    bool isRotating = false,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        alignment: Alignment.center,
        child: isRotating
            ? RotationTransition(
                turns: const AlwaysStoppedAnimation(0),
                child: Icon(icon, size: 24),
              )
            : Icon(icon, size: 24),
      ),
    );
  }
} 