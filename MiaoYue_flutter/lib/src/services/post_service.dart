import '../shared/models/post_model.dart';
import '../shared/models/user_model.dart';

class PostService {
  // 模拟获取帖子列表
  Future<List<PostModel>> getFeedPosts(int offset, {int limit = 10}) async {
    // 在真实环境中，这里会从API获取帖子
    await Future.delayed(const Duration(seconds: 1));

    // 如果已经加载了30条帖子，模拟没有更多帖子了
    if (offset >= 30) {
      return [];
    }

    // 创建模拟帖子
    List<PostModel> posts = [];
    for (int i = 0; i < limit; i++) {
      posts.add(_createMockPost(offset + i));
    }

    return posts;
  }

  // 模拟点赞/取消点赞帖子
  Future<bool> likePost(String postId, bool isLike) async {
    // 在真实环境中，这里会将点赞状态发送到API
    await Future.delayed(const Duration(seconds: 1));
    return true;
  }

  // 创建一个模拟帖子
  PostModel _createMockPost(int id) {
    final List<String> mockContents = [
      '今天天气真好，带猫咪出去晒太阳啦！😺',
      '有没有喜欢英短蓝猫的朋友？我家猫咪刚生了一窝小猫咪，求好心人领养～',
      '分享一个养猫小技巧：猫咪不喜欢喝水时，可以尝试给它准备流动的水源，比如猫咪饮水机。',
      '最近给猫咪换了新猫砂，效果很好，推荐给大家！#铲屎官日常',
      '新买的猫抓板，猫主子很喜欢！安利给各位铲屎官～',
      '有没有推荐的猫咪医院？最近家里的喵需要体检了。',
    ];
    
    final List<List<String>> mockImageSets = [
      ['assets/images/post1.jpg'],
      ['assets/images/post2.jpg', 'assets/images/post3.jpg'],
      ['assets/images/post4.jpg', 'assets/images/post5.jpg', 'assets/images/post6.jpg'],
      [],
      ['assets/images/post7.jpg'],
      ['assets/images/post8.jpg', 'assets/images/post9.jpg'],
    ];

    final List<String?> locations = [
      '上海市',
      '北京市',
      '广州市',
      '深圳市',
      null,
      '杭州市',
    ];

    // 使用索引取模来循环使用模拟内容
    final contentIndex = id % mockContents.length;

    return PostModel(
      id: 'post_$id',
      content: mockContents[contentIndex],
      imageUrls: mockImageSets[contentIndex],
      author: UserModel(
        id: 'user_${100 + (id % 5)}',
        nickName: '猫咪爱好者${100 + (id % 5)}',
        avatarUrl: 'assets/images/avatar${1 + (id % 5)}.png',
      ),
      createdAt: DateTime.now().subtract(Duration(hours: id * 2)),
      likesCount: 10 + (id % 90),
      commentsCount: 5 + (id % 20),
      isLiked: id % 3 == 0,
      location: locations[contentIndex],
    );
  }
} 