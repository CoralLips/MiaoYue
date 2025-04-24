import 'package:flutter/material.dart';

class CustomSearchBar extends StatefulWidget {
  final String? initialValue;
  final String placeholder;
  final Function(String) onSearch;
  final bool autoFocus;

  const CustomSearchBar({
    super.key,
    this.initialValue,
    this.placeholder = '搜索用户、商家、活动...',
    required this.onSearch,
    this.autoFocus = false,
  });

  @override
  State<CustomSearchBar> createState() => _CustomSearchBarState();
}

class _CustomSearchBarState extends State<CustomSearchBar> {
  late TextEditingController _controller;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue ?? '');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 50,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          const SizedBox(width: 16),
          const Icon(Icons.search, color: Colors.grey),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: _controller,
              autofocus: widget.autoFocus,
              decoration: InputDecoration(
                hintText: widget.placeholder,
                border: InputBorder.none,
                hintStyle: const TextStyle(color: Colors.grey),
              ),
              onChanged: (value) {
                // 实时搜索
                widget.onSearch(value);
              },
              onSubmitted: (value) {
                // 提交搜索
                widget.onSearch(value);
              },
              onTap: () {
                setState(() {
                  _isFocused = true;
                });
              },
              onEditingComplete: () {
                setState(() {
                  _isFocused = false;
                });
                FocusScope.of(context).unfocus();
              },
            ),
          ),
          if (_controller.text.isNotEmpty)
            GestureDetector(
              onTap: () {
                _controller.clear();
                widget.onSearch('');
              },
              child: const Padding(
                padding: EdgeInsets.all(8.0),
                child: Icon(Icons.close, color: Colors.grey),
              ),
            ),
          const SizedBox(width: 8),
        ],
      ),
    );
  }
} 