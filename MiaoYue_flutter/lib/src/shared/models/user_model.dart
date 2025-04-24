class UserModel {
  final String? id;
  final String? nickName;
  final String? avatarUrl;
  final String? introduction;
  final String? wechat;
  final String? phone;
  final List<MediaItem>? mediaList;
  final String? nickname;
  final String? gender;
  final int? followersCount;
  final int? followingCount;
  final int? friendsCount;

  UserModel({
    this.id,
    this.nickName,
    this.avatarUrl,
    this.introduction,
    this.wechat,
    this.phone,
    this.mediaList,
    this.nickname,
    this.gender,
    this.followersCount,
    this.followingCount,
    this.friendsCount,
  });

  // 从JSON创建UserModel
  factory UserModel.fromJson(Map<String, dynamic> json) {
    List<MediaItem>? mediaList;
    if (json['mediaList'] != null) {
      mediaList = (json['mediaList'] as List)
          .map((item) => MediaItem.fromJson(item))
          .toList();
    }

    return UserModel(
      id: json['id'],
      nickName: json['nickName'],
      avatarUrl: json['avatarUrl'],
      introduction: json['introduction'],
      wechat: json['wechat'],
      phone: json['phone'],
      mediaList: mediaList,
      nickname: json['nickname'],
      gender: json['gender'],
      followersCount: json['followersCount'],
      followingCount: json['followingCount'],
      friendsCount: json['friendsCount'],
    );
  }

  // 转换为JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nickName': nickName,
      'avatarUrl': avatarUrl,
      'introduction': introduction,
      'wechat': wechat,
      'phone': phone,
      'mediaList': mediaList?.map((item) => item.toJson()).toList(),
      'nickname': nickname,
      'gender': gender,
      'followersCount': followersCount,
      'followingCount': followingCount,
      'friendsCount': friendsCount,
    };
  }

  UserModel copyWith({
    String? id,
    String? nickName,
    String? avatarUrl,
    String? introduction,
    String? wechat,
    String? phone,
    List<MediaItem>? mediaList,
    String? nickname,
    String? gender,
    int? followersCount,
    int? followingCount,
    int? friendsCount,
  }) {
    return UserModel(
      id: id ?? this.id,
      nickName: nickName ?? this.nickName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      introduction: introduction ?? this.introduction,
      wechat: wechat ?? this.wechat,
      phone: phone ?? this.phone,
      mediaList: mediaList ?? this.mediaList,
      nickname: nickname ?? this.nickname,
      gender: gender ?? this.gender,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      friendsCount: friendsCount ?? this.friendsCount,
    );
  }
}

class MediaItem {
  final String fileID;
  final String type; // 'image' or 'video'
  final String? thumbUrl; // 缩略图URL，视频时使用

  MediaItem({
    required this.fileID,
    required this.type,
    this.thumbUrl,
  });

  // 从JSON创建MediaItem
  factory MediaItem.fromJson(Map<String, dynamic> json) {
    return MediaItem(
      fileID: json['fileID'],
      type: json['type'],
      thumbUrl: json['thumbUrl'],
    );
  }

  // 转换为JSON
  Map<String, dynamic> toJson() {
    return {
      'fileID': fileID,
      'type': type,
      'thumbUrl': thumbUrl,
    };
  }
} 