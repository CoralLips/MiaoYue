Page({
  data: {
    userInfo: {
      avatarUrl: '/images/avatar.png',
      nickName: '点击设置昵称',
      _openid: '',
      introduction: '这个用户很懒，还没有填写介绍~',
      wechat: '',
      phone: '',
      mediaList: []
    },
    isEditing: false,
    editIntroduction: '',
    isLoggedIn: false,
    isLoading: true
  },

  onLoad() {
    const app = getApp();
    if (app.globalData.openid) {
      this.loadUserProfile(app.globalData.openid);
    } else {
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
    const app = getApp();
    if (app.globalData.openid && this.data.isLoggedIn) {
      // 检查是否需要刷新数据
      const lastUpdateTime = wx.getStorageSync('userProfileLastUpdate');
      const now = Date.now();
      if (!lastUpdateTime || now - lastUpdateTime > 5 * 60 * 1000) { // 5分钟更新一次
        this.loadUserProfile(app.globalData.openid);
      }
    }
  },

  // 加载用户资料
  loadUserProfile(openid) {
    // 先尝试从缓存加载
    const cachedUserInfo = wx.getStorageSync('userProfile');
    if (cachedUserInfo && cachedUserInfo._openid === openid) {
      this.setData({
        userInfo: cachedUserInfo,
        isLoggedIn: true,
        isLoading: false
      });
    }

    const db = wx.cloud.database();
    
    // 即使有缓存也在后台更新数据
    db.collection('users').where({
      _openid: openid
    }).get().then(res => {
      if (res.data.length > 0) {
        const userProfile = res.data[0];
        const userInfo = {
          avatarUrl: userProfile.avatarUrl || '/images/avatar.png',
          nickName: userProfile.nickName || '用户' + openid.substring(0, 4),
          _openid: openid,
          introduction: userProfile.introduction || '这个用户很懒，还没有填写介绍~',
          mediaList: userProfile.mediaList || [],
          wechat: userProfile.wechat || '',
          phone: userProfile.phone || ''
        };

        // 更新缓存
        wx.setStorageSync('userProfile', userInfo);
        wx.setStorageSync('userProfileLastUpdate', Date.now());

        this.setData({
          userInfo,
          isLoggedIn: true,
          isLoading: false
        });
      } else {
        // 用户不存在，创建新用户
        this.createNewUser(openid);
      }
    }).catch(err => {
      console.error('获取用户资料失败', err);
      // 如果有缓存数据，继续使用
      if (!cachedUserInfo) {
        this.setData({
          isLoading: false
        });
        wx.showToast({
          title: '获取用户资料失败',
          icon: 'none'
        });
      }
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
        wechat: '',
        phone: '',
        createTime: db.serverDate()
      }
    }).then(res => {
      console.log('用户创建成功', res);
      this.setData({
        userInfo: {
          avatarUrl: '/images/avatar.png',
          nickName: defaultNickName,
          _openid: openid,
          introduction: '这个用户很懒，还没有填写介绍~',
          mediaList: [],
          wechat: '',
          phone: ''
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
        const cloudPath = `avatars/${this.data.userInfo._openid}_${new Date().getTime()}.jpg`;
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
    wx.showModal({
      title: '编辑介绍',
      content: '请输入您的个人介绍',
      editable: true,
      placeholderText: '这个用户很懒，还没有填写介绍~',
      value: this.data.userInfo.introduction || '',
      success: res => {
        if (res.confirm && res.content) {
          this.updateUserField('introduction', res.content);
        }
      }
    });
  },

  // 处理联系方式编辑
  handleEditContact(e) {
    const { type } = e.detail;
    const title = type === 'wechat' ? '修改微信号' : '修改手机号';
    const content = type === 'wechat' ? '请输入微信号' : '请输入手机号';
    const currentValue = this.data.userInfo[type] || '';

    wx.showModal({
      title,
      content,
      editable: true,
      placeholderText: currentValue,
      success: (res) => {
        if (res.confirm) {
          // 更新联系方式
          this.updateUserField(type, res.content);
        }
      }
    });
  },

  // 上传媒体
  uploadMedia() {
    wx.showActionSheet({
      itemList: ['上传图片', '上传视频'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.chooseAndUploadImage();
        } else {
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
          const cloudPath = `media/${this.data.userInfo._openid}/image_${new Date().getTime()}_${index}.jpg`;
          return wx.cloud.uploadFile({
            cloudPath,
            filePath
          });
        });
        
        // 等待所有上传任务完成
        Promise.all(uploadTasks).then(results => {
          const newMediaList = results.map(res => ({
            fileID: res.fileID,
            type: 'image',
            createTime: new Date().getTime()
          }));
          
          // 更新用户媒体列表
          const mediaList = this.data.userInfo.mediaList.concat(newMediaList);
          this.updateMediaList(mediaList);
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
        // 显示加载中
        wx.showLoading({
          title: '上传中...'
        });
        
        // 上传视频文件
        const cloudPath = `media/${this.data.userInfo._openid}/video_${new Date().getTime()}.mp4`;
        wx.cloud.uploadFile({
          cloudPath,
          filePath: res.tempFilePath,
          success: (uploadRes) => {
            // 生成视频封面
            const thumbPath = `media/${this.data.userInfo._openid}/thumb_${new Date().getTime()}.jpg`;
            wx.cloud.uploadFile({
              cloudPath: thumbPath,
              filePath: res.thumbTempFilePath,
              success: (thumbRes) => {
                const newMedia = {
                  fileID: uploadRes.fileID,
                  thumbUrl: thumbRes.fileID,
                  type: 'video',
                  createTime: new Date().getTime()
                };
                
                // 更新用户媒体列表
                const mediaList = this.data.userInfo.mediaList.concat([newMedia]);
                this.updateMediaList(mediaList);
              },
              fail: (err) => {
                console.error('上传视频封面失败', err);
              }
            });
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

  // 删除媒体
  deleteMedia(e) {
    const { index } = e.detail;
    const media = this.data.userInfo.mediaList[index];
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个' + (media.type === 'image' ? '图片' : '视频') + '吗？',
      success: (res) => {
        if (res.confirm) {
          // 从云存储中删除文件
          const deletePromises = [wx.cloud.deleteFile({
            fileList: [media.fileID]
          })];
          
          // 如果是视频，还需要删除封面
          if (media.type === 'video' && media.thumbUrl) {
            deletePromises.push(wx.cloud.deleteFile({
              fileList: [media.thumbUrl]
            }));
          }
          
          Promise.all(deletePromises).then(() => {
            // 更新媒体列表
            const mediaList = this.data.userInfo.mediaList.slice();
            mediaList.splice(index, 1);
            this.updateMediaList(mediaList);
          }).catch(err => {
            console.error('删除文件失败', err);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 预览媒体
  previewMedia(e) {
    const { index } = e.detail;
    const media = this.data.userInfo.mediaList[index];
    
    if (media.type === 'image') {
      // 预览图片
      const imageUrls = this.data.userInfo.mediaList
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

  // 更新用户字段
  updateUserField(field, value) {
    const db = wx.cloud.database();
    const app = getApp();
    
    wx.showLoading({
      title: '更新中...'
    });
    
    const updateData = {};
    updateData[field] = value;
    
    db.collection('users').where({
      _openid: app.globalData.openid
    }).update({
      data: updateData
    }).then(() => {
      // 更新本地数据和缓存
      const userInfo = {...this.data.userInfo};
      userInfo[field] = value;
      this.setData({ userInfo });
      
      // 更新缓存
      wx.setStorageSync('userProfile', userInfo);
      wx.setStorageSync('userProfileLastUpdate', Date.now());
      
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

  // 更新媒体列表
  updateMediaList(mediaList) {
    const db = wx.cloud.database();
    const app = getApp();
    
    db.collection('users').where({
      _openid: app.globalData.openid
    }).update({
      data: {
        mediaList: mediaList
      }
    }).then(() => {
      // 更新本地数据
      const userInfo = Object.assign({}, this.data.userInfo, {
        mediaList: mediaList
      });
      this.setData({
        userInfo: userInfo
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });
    }).catch(err => {
      console.error('更新媒体列表失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    });
  }
}); 