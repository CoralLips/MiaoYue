import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// 应用主题配置类
class AppTheme {
  // 微信绿色主题色
  static const Color primaryColor = Color(0xFF07C160);
  
  // 微信次要绿色（深一点的绿色）
  static const Color primaryDarkColor = Color(0xFF06AD56);
  
  // 微信灰色系
  static const Color lightGrey = Color(0xFFF7F7F7); // 背景灰
  static const Color mediumGrey = Color(0xFFEDEDED); // 分割线/边框灰
  static const Color darkGrey = Color(0xFF9B9B9B);  // 次要文本灰
  static const Color textGrey = Color(0xFF919191);  // 次要文本灰
  
  // 微信风格导航栏和状态栏灰色
  static const Color wechatBarGrey = Color(0xFFEFEFEF); // 微信导航栏/标题栏灰色
  
  // 文本颜色
  static const Color primaryText = Color(0xFF333333); // 主要文本
  static const Color secondaryText = Color(0xFF666666); // 次要文本
  static const Color tertiaryText = Color(0xFF999999); // 第三级文本
  
  // 功能色
  static const Color errorColor = Color(0xFFFF4D4F); // 错误色/危险色
  static const Color warningColor = Color(0xFFFAAD14); // 警告色
  static const Color successColor = primaryColor; // 成功色
  
  // 尺寸常量
  static const double buttonBorderRadius = 8.0; // 按钮圆角
  static const double cardBorderRadius = 8.0; // 卡片圆角
  static const double defaultPadding = 16.0; // 默认内边距
  static const double smallPadding = 8.0; // 小内边距
  
  // 文字样式
  static const TextStyle heading1 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: primaryText,
  );
  
  static const TextStyle heading2 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: primaryText,
  );
  
  static const TextStyle body1 = TextStyle(
    fontSize: 16,
    color: primaryText,
  );
  
  static const TextStyle body2 = TextStyle(
    fontSize: 14,
    color: secondaryText,
  );

  // 导航栏主题
  static BottomNavigationBarThemeData bottomNavigationBarTheme() {
    return BottomNavigationBarThemeData(
      backgroundColor: wechatBarGrey,
      selectedItemColor: primaryColor,
      unselectedItemColor: darkGrey,
      selectedLabelStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.normal,
      ),
      unselectedLabelStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.normal,
      ),
      elevation: 0, // 去除阴影，微信风格
      type: BottomNavigationBarType.fixed,
    );
  }
  
  // AppBar主题
  static AppBarTheme appBarTheme() {
    return const AppBarTheme(
      color: wechatBarGrey,
      elevation: 0,
      centerTitle: true,
      iconTheme: IconThemeData(color: primaryText),
      titleTextStyle: TextStyle(
        color: primaryText,
        fontSize: 17,
        fontWeight: FontWeight.bold, // 加粗标题字体
      ),
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarColor: wechatBarGrey, // 状态栏颜色
        statusBarIconBrightness: Brightness.dark, // 状态栏图标颜色
        systemNavigationBarColor: wechatBarGrey, // 导航栏颜色
        systemNavigationBarIconBrightness: Brightness.dark, // 导航栏图标颜色
      ),
    );
  }
  
  // 主题数据
  static ThemeData themeData() {
    return ThemeData(
      useMaterial3: true,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: lightGrey,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        secondary: primaryDarkColor,
        background: lightGrey,
        surface: Colors.white,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onBackground: primaryText,
        onSurface: primaryText,
        error: errorColor,
      ),
      
      // 卡片主题
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 0.5,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardBorderRadius),
        ),
      ),
      
      // 分割线主题
      dividerTheme: const DividerThemeData(
        color: mediumGrey,
        thickness: 0.5,
        space: 0,
      ),
      
      // 输入框主题
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(cardBorderRadius),
          borderSide: const BorderSide(color: mediumGrey, width: 0.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(cardBorderRadius),
          borderSide: const BorderSide(color: mediumGrey, width: 0.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(cardBorderRadius),
          borderSide: const BorderSide(color: primaryColor, width: 1.0),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(cardBorderRadius),
          borderSide: const BorderSide(color: errorColor, width: 1.0),
        ),
      ),
      
      // 按钮主题
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.normal,
          ),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonBorderRadius),
          ),
        ),
      ),
      
      // 文本按钮主题
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryColor,
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.normal,
          ),
        ),
      ),
      
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          side: const BorderSide(color: primaryColor),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonBorderRadius),
          ),
        ),
      ),
      
      // 文本主题
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: primaryText, fontSize: 24, fontWeight: FontWeight.bold),
        displayMedium: TextStyle(color: primaryText, fontSize: 22, fontWeight: FontWeight.bold),
        displaySmall: TextStyle(color: primaryText, fontSize: 20, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(color: primaryText, fontSize: 18, fontWeight: FontWeight.w500),
        titleLarge: TextStyle(color: primaryText, fontSize: 16, fontWeight: FontWeight.w500),
        titleMedium: TextStyle(color: primaryText, fontSize: 16, fontWeight: FontWeight.normal),
        bodyLarge: TextStyle(color: primaryText, fontSize: 16, fontWeight: FontWeight.normal),
        bodyMedium: TextStyle(color: primaryText, fontSize: 14, fontWeight: FontWeight.normal),
        bodySmall: TextStyle(color: secondaryText, fontSize: 12, fontWeight: FontWeight.normal),
      ),
      
      // 底部导航栏主题
      bottomNavigationBarTheme: bottomNavigationBarTheme(),
      
      // AppBar主题
      appBarTheme: appBarTheme(),
    );
  }
} 