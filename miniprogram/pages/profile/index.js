Page({
  data: {
    userInfo: {
      avatarUrl: '/images/avatar.png',
      nickName: '点击设置昵称',
      userId: ''
    },
    introduction: '这个用户很懒，还没有填写介绍~',
    isEditing: false,
    editIntroduction: '',
    mediaList: [], // 用户上传的照片和视频列表
    isLoggedIn: false, // 是否已登录
    isLoading: true // 是否正在加载
  },

  onLoad() {
    // 检查用户是否已登录（是否有openid）
    const app = getApp();
    if (app.globalData.openid) {
      this.loadUserProfile(app.globalData.openid);
    } else {
      // 尝试获取openid
      app.getOpenid((openid) => {
        if (openid) {
          this.loadUserProfile(openid);
        } else {
          this.setData({
            isLoading: false
          });
        }
      });
    }
  },

  onShow() {
    // 每次显示页面时刷新数据
    const app = getApp();
    if (app.globalData.openid && this.data.isLoggedIn) {
      this.loadUserProfile(app.globalData.openid);
    }
  },

  // 加载用户资料
  loadUserProfile(openid) {
    const db = wx.cloud.database();
    
    // 显示加载中
    this.setData({
      isLoading: true
    });
    
    // 查询用户资料
    db.collection('users').where({
      _openid: openid
    }).get().then(res => {
      if (res.data.length > 0) {
        // 用户存在，加载资料
        const userProfile = res.data[0];
        this.setData({
          userInfo: {
            avatarUrl: userProfile.avatarUrl || '/images/avatar.png',
            nickName: userProfile.nickName || '用户' + openid.substring(0, 4),
            userId: openid
          },
          introduction: userProfile.introduction || '这个用户很懒，还没有填写介绍~',
          mediaList: userProfile.mediaList || [],
          isLoggedIn: true,
          isLoading: false
        });
      } else {
        // 用户不存在，创建新用户
        this.createNewUser(openid);
      }
    }).catch(err => {
      console.error('获取用户资料失败', err);
      this.setData({
        isLoading: false
      });
      wx.showToast({
        title: '获取用户资料失败',
        icon: 'none'
      });
    });
  },

  // 创建新用户
  createNewUser(openid) {
    const db = wx.cloud.database();
    const defaultNickName = '用户' + openid.substring(0, 4);
    
    db.collection('users').add({
      data: {
        nickName: defaultNickName,
        avatarUrl: '/images/avatar.png',
        introduction: '这个用户很懒，还没有填写介绍~',
        mediaList: [],
        createTime: db.serverDate()
      }
    }).then(res => {
      console.log('用户创建成功', res);
      this.setData({
        userInfo: {
          avatarUrl: '/images/avatar.png',
          nickName: defaultNickName,
          userId: openid
        },
        isLoggedIn: true,
        isLoading: false
      });
    }).catch(err => {
      console.error('用户创建失败', err);
      this.setData({
        isLoading: false
      });
    });
  },

  // 编辑头像
  editAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 显示加载中
        wx.showLoading({
          title: '上传中...'
        });
        
        // 上传图片到云存储
        const cloudPath = `avatars/${this.data.userInfo.userId}_${new Date().getTime()}.jpg`;
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePath,
          success: (res) => {
            // 更新用户头像
            this.updateUserField('avatarUrl', res.fileID);
          },
          fail: (err) => {
            console.error('上传头像失败', err);
            wx.hideLoading();
            wx.showToast({
              title: '上传头像失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  // 编辑昵称
  editNickname() {
    wx.showModal({
      title: '修改昵称',
      content: '请输入新的昵称',
      editable: true,
      placeholderText: this.data.userInfo.nickName,
      success: (res) => {
        if (res.confirm && res.content) {
          // 更新用户昵称
          this.updateUserField('nickName', res.content);
        }
      }
    });
  },

  // 开始编辑介绍
  startEditIntroduction() {
    this.setData({
      isEditing: true,
      editIntroduction: this.data.introduction
    });
  },

  // 保存介绍
  saveIntroduction() {
    this.updateUserField('introduction', this.data.editIntroduction);
    this.setData({
      isEditing: false
    });
  },

  // 取消编辑介绍
  cancelEditIntroduction() {
    this.setData({
      isEditing: false
    });
  },

  // 介绍输入变化
  onIntroductionInput(e) {
    this.setData({
      editIntroduction: e.detail.value
    });
  },

  // 上传媒体（照片或视频）
  uploadMedia() {
    wx.showActionSheet({
      itemList: ['上传照片', '上传视频'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 上传照片
          this.chooseAndUploadImage();
        } else if (res.tapIndex === 1) {
          // 上传视频
          this.chooseAndUploadVideo();
        }
      }
    });
  },

  // 选择并上传图片
  chooseAndUploadImage() {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        
        // 显示加载中
        wx.showLoading({
          title: '上传中...'
        });
        
        // 上传所有选中的图片
        const uploadTasks = tempFilePaths.map((filePath, index) => {
          const cloudPath = `media/${this.data.userInfo.userId}/image_${new Date().getTime()}_${index}.jpg`;
          return wx.cloud.uploadFile({
            cloudPath,
            filePath
          });
        });
        
        // 等待所有上传任务完成
        Promise.all(uploadTasks).then(results => {
          const newMediaList = results.map(res => {
            return {
              fileID: res.fileID,
              type: 'image',
              createTime: new Date().getTime()
            };
          });
          
          // 更新用户媒体列表
          this.updateMediaList(newMediaList);
        }).catch(err => {
          console.error('上传图片失败', err);
          wx.hideLoading();
          wx.showToast({
            title: '上传图片失败',
            icon: 'none'
          });
        });
      }
    });
  },

  // 选择并上传视频
  chooseAndUploadVideo() {
    wx.chooseVideo({
      sourceType: ['album'],
      maxDuration: 60,
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFilePath;
        
        // 显示加载中
        wx.showLoading({
          title: '上传中...'
        });
        
        // 上传视频到云存储
        const cloudPath = `media/${this.data.userInfo.userId}/video_${new Date().getTime()}.mp4`;
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePath,
          success: (res) => {
            const newMedia = {
              fileID: res.fileID,
              type: 'video',
              createTime: new Date().getTime(),
              thumbUrl: '', // 视频缩略图，可以通过云函数生成
              duration: Math.floor(res.duration) // 视频时长
            };
            
            // 更新用户媒体列表
            this.updateMediaList([newMedia]);
          },
          fail: (err) => {
            console.error('上传视频失败', err);
            wx.hideLoading();
            wx.showToast({
              title: '上传视频失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  // 更新媒体列表
  updateMediaList(newMediaItems) {
    const db = wx.cloud.database();
    const app = getApp();
    
    // 获取当前媒体列表
    db.collection('users').where({
      _openid: app.globalData.openid
    }).get().then(res => {
      if (res.data.length > 0) {
        const currentMediaList = res.data[0].mediaList || [];
        const updatedMediaList = [...currentMediaList, ...newMediaItems];
        
        // 更新数据库
        db.collection('users').where({
          _openid: app.globalData.openid
        }).update({
          data: {
            mediaList: updatedMediaList
          }
        }).then(() => {
          // 更新本地数据
          this.setData({
            mediaList: updatedMediaList
          });
          
          wx.hideLoading();
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        }).catch(err => {
          console.error('更新媒体列表失败', err);
          wx.hideLoading();
          wx.showToast({
            title: '更新媒体列表失败',
            icon: 'none'
          });
        });
      }
    }).catch(err => {
      console.error('获取媒体列表失败', err);
      wx.hideLoading();
    });
  },

  // 更新用户字段
  updateUserField(field, value) {
    const db = wx.cloud.database();
    const app = getApp();
    
    // 显示加载中
    wx.showLoading({
      title: '更新中...'
    });
    
    // 更新数据库
    const updateData = {};
    updateData[field] = value;
    
    db.collection('users').where({
      _openid: app.globalData.openid
    }).update({
      data: updateData
    }).then(() => {
      // 更新本地数据
      if (field === 'avatarUrl') {
        this.setData({
          'userInfo.avatarUrl': value
        });
      } else if (field === 'nickName') {
        this.setData({
          'userInfo.nickName': value
        });
      } else if (field === 'introduction') {
        this.setData({
          introduction: value
        });
      }
      
      wx.hideLoading();
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });
    }).catch(err => {
      console.error('更新用户资料失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    });
  },

  // 预览媒体
  previewMedia(e) {
    const index = e.currentTarget.dataset.index;
    const media = this.data.mediaList[index];
    
    if (media.type === 'image') {
      // 预览图片
      const imageUrls = this.data.mediaList
        .filter(item => item.type === 'image')
        .map(item => item.fileID);
      
      wx.previewImage({
        current: media.fileID,
        urls: imageUrls
      });
    } else if (media.type === 'video') {
      // 播放视频
      wx.navigateTo({
        url: `/pages/video-player/index?fileID=${encodeURIComponent(media.fileID)}`
      });
    }
  },

  // 删除媒体
  deleteMedia(e) {
    const index = e.currentTarget.dataset.index;
    const media = this.data.mediaList[index];
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个' + (media.type === 'image' ? '图片' : '视频') + '吗？',
      success: (res) => {
        if (res.confirm) {
          // 从云存储中删除文件
          wx.cloud.deleteFile({
            fileList: [media.fileID],
            success: () => {
              // 从数据库中删除记录
              const newMediaList = [...this.data.mediaList];
              newMediaList.splice(index, 1);
              
              this.setData({
                mediaList: newMediaList
              });
              
              // 更新数据库
              const db = wx.cloud.database();
              const app = getApp();
              
              db.collection('users').where({
                _openid: app.globalData.openid
              }).update({
                data: {
                  mediaList: newMediaList
                }
              }).then(() => {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              }).catch(err => {
                console.error('更新媒体列表失败', err);
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                });
              });
            },
            fail: (err) => {
              console.error('删除文件失败', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  }
}); 