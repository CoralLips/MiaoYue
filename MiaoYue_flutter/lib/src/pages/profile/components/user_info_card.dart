import 'package:flutter/material.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/widgets/circle_avatar.dart';
import '../../../shared/widgets/custom_card.dart';

class UserInfoCard extends StatelessWidget {
  final UserModel? userInfo;
  final VoidCallback onAvatarTap;
  final VoidCallback onNicknameTap;

  const UserInfoCard({
    super.key,
    this.userInfo,
    required this.onAvatarTap,
    required this.onNicknameTap,
  });

  @override
  Widget build(BuildContext context) {
    return CustomCard(
      margin: const EdgeInsets.all(16),
      child: Row(
        children: [
          // 头像
          GestureDetector(
            onTap: onAvatarTap,
            child: CustomCircleAvatar(
              imageUrl: userInfo?.avatarUrl,
              radius: 40,
            ),
          ),
          const SizedBox(width: 16),
          // 用户名和ID
          Expanded(
            child: GestureDetector(
              onTap: onNicknameTap,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    userInfo?.nickName ?? '未设置昵称',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'ID: ${userInfo?.id ?? ''}',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 14,
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
} 