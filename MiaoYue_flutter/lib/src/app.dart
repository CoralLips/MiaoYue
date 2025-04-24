import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'config/theme.dart';
import 'pages/home/home_page.dart';
import 'pages/explore/explore_page.dart';
import 'pages/profile/profile_page.dart';
import 'shared/widgets/bottom_nav_bar.dart';

// 创建一个无动画的页面转换
CustomTransitionPage<T> noTransitionPage<T>({
  required BuildContext context,
  required GoRouterState state,
  required Widget child,
}) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) => child,
    transitionDuration: Duration.zero,
  );
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: '喵月',
      theme: AppTheme.themeData(),
      debugShowCheckedModeBanner: false,
      routerConfig: _router,
    );
  }
}

// 主屏幕，包含底部导航栏
class MainScreen extends StatefulWidget {
  final Widget child;
  final int currentIndex;

  const MainScreen({
    super.key, 
    required this.child, 
    required this.currentIndex
  });

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavBar(
        currentIndex: widget.currentIndex,
        onTap: (index) {
          // 根据索引切换页面
          switch(index) {
            case 0:
              context.go('/');
              break;
            case 1:
              context.go('/explore');
              break;
            case 2:
              context.go('/profile');
              break;
          }
        },
      ),
    );
  }
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) {
        // 根据当前路径设置底部导航栏选中项
        int index = 0;
        final String location = state.uri.path;
        if (location.startsWith('/explore')) {
          index = 1;
        } else if (location.startsWith('/profile')) {
          index = 2;
        }
        return MainScreen(child: child, currentIndex: index);
      },
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomePage(),
          pageBuilder: (context, state) => noTransitionPage(
            context: context,
            state: state,
            child: const HomePage(),
          ),
        ),
        GoRoute(
          path: '/explore',
          builder: (context, state) => const ExplorePage(),
          pageBuilder: (context, state) => noTransitionPage(
            context: context,
            state: state,
            child: const ExplorePage(),
          ),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfilePage(),
          pageBuilder: (context, state) => noTransitionPage(
            context: context,
            state: state,
            child: const ProfilePage(),
          ),
        ),
      ],
    ),
  ],
); 