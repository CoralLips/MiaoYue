import 'package:flutter/material.dart';
import '../../../shared/widgets/custom_card.dart';

class ContactCard extends StatelessWidget {
  final String? wechat;
  final String? phone;
  final Function(String, String) onEdit;

  const ContactCard({
    super.key,
    this.wechat,
    this.phone,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return CustomCard(
      title: '联系方式',
      trailing: const Text(
        '仅匹配后可见',
        style: TextStyle(
          fontSize: 12,
          color: Colors.grey,
        ),
      ),
      child: Column(
        children: [
          _buildContactItem(
            context: context,
            type: 'wechat',
            label: '微信号',
            value: wechat,
          ),
          const Divider(),
          _buildContactItem(
            context: context,
            type: 'phone',
            label: '手机号',
            value: phone,
          ),
        ],
      ),
    );
  }

  Widget _buildContactItem({
    required BuildContext context,
    required String type,
    required String label,
    required String? value,
  }) {
    return InkWell(
      onTap: () => _showEditDialog(context, type, value ?? ''),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 16,
              ),
            ),
            Text(
              value ?? '未设置',
              style: TextStyle(
                fontSize: 16,
                color: value != null ? Colors.black : Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditDialog(BuildContext context, String type, String currentValue) {
    final TextEditingController controller = TextEditingController(text: currentValue);
    final String title = type == 'wechat' ? '编辑微信号' : '编辑手机号';
    
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(title),
          content: TextField(
            controller: controller,
            decoration: InputDecoration(
              hintText: type == 'wechat' ? '请输入微信号' : '请输入手机号',
            ),
            keyboardType: type == 'phone' ? TextInputType.phone : TextInputType.text,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('取消'),
            ),
            TextButton(
              onPressed: () {
                onEdit(type, controller.text);
                Navigator.pop(context);
              },
              child: const Text('保存'),
            ),
          ],
        );
      },
    ).then((_) {
      controller.dispose();
    });
  }
} 