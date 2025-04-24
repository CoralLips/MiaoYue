import 'package:flutter/material.dart';
import '../../../shared/widgets/custom_card.dart';

class IntroductionCard extends StatefulWidget {
  final String introduction;
  final Function(String) onEdit;

  const IntroductionCard({
    super.key,
    required this.introduction,
    required this.onEdit,
  });

  @override
  State<IntroductionCard> createState() => _IntroductionCardState();
}

class _IntroductionCardState extends State<IntroductionCard> {
  late TextEditingController _controller;
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.introduction);
  }

  @override
  void didUpdateWidget(IntroductionCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.introduction != widget.introduction) {
      _controller.text = widget.introduction;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CustomCard(
      title: '个人介绍',
      child: Column(
        children: [
          TextField(
            controller: _controller,
            maxLines: 3,
            maxLength: 200,
            decoration: const InputDecoration(
              hintText: '点击这里编辑个人介绍',
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
            ),
            onTap: () {
              setState(() {
                _isEditing = true;
              });
            },
            onEditingComplete: _saveIntroduction,
          ),
          if (_isEditing)
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () {
                    setState(() {
                      _controller.text = widget.introduction;
                      _isEditing = false;
                    });
                    FocusScope.of(context).unfocus();
                  },
                  child: const Text('取消'),
                ),
                TextButton(
                  onPressed: _saveIntroduction,
                  child: const Text('保存'),
                ),
              ],
            ),
        ],
      ),
    );
  }

  void _saveIntroduction() {
    if (_isEditing) {
      setState(() {
        _isEditing = false;
      });
      widget.onEdit(_controller.text);
      FocusScope.of(context).unfocus();
    }
  }
} 