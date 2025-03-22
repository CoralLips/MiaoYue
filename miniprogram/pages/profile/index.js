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

  async onLoad() {
    console.log('[Profile] onLoad 开始');
    const app = getApp();
    console.log('[Profile] globalData:', app.globalData);

    // 添加超时保护
    setTimeout(() => {
      if (this.data.isLoading) {
        console.log('[Profile] 加载超时');
        this.setData({
          isLoading: false,
          userInfo: {
            ...this.data.userInfo,
            nickName: '加载超时,请重试'
          }
        });
      }
    }, 10000);

    try {
      let openid;
      if (app.globalData.openid) {
        console.log('[Profile] 已有openid:', app.globalData.openid);
        openid = app.globalData.openid;
      } else {
        console.log('[Profile] 尝试获取openid');
        openid = await app.getOpenid();
        console.log('[Profile] getOpenid结果:', openid);
      }

      if (openid) {
        await this.loadUserProfile(openid);
      } else {
        console.log('[Profile] 获取openid失败');
        this.setData({
          isLoading: false,
          userInfo: {
            ...this.data.userInfo,
            nickName: '请先登录'
          }
        });
        wx.showToast({
          title: '登录失败,请重试',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('[Profile] onLoad错误:', error);
      this.setData({
        isLoading: false,
        userInfo: {
          ...this.data.userInfo,
          nickName: '加载失败,请重试'
        }
      });
      wx.showToast({
        title: '加载失败,请重试',
        icon: 'none'
      });
    }
  },

  onShow() {
    console.log('Profile page onShow');
    const app = getApp();
    if (app.globalData.openid && this.data.isLoggedIn) {
      // 检查是否需要刷新数据
      const lastUpdateTime = wx.getStorageSync('userProfileLastUpdate');
      const now = Date.now();
      if (!lastUpdateTime || now - lastUpdateTime > 5 * 60 * 1000) { // 5分钟更新一次
        console.log('Refreshing user profile');
        this.loadUserProfile(app.globalData.openid);
      }
    }

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
  },

  // 加载用户资料
  async loadUserProfile(openid) {
    console.log('[Profile] 开始加载用户资料:', openid);
    
    // 先尝试从缓存加载
    const cachedUserInfo = wx.getStorageSync('userProfile');
    console.log('[Profile] 缓存数据:', cachedUserInfo);
    
    if (cachedUserInfo && cachedUserInfo._openid === openid) {
      console.log('[Profile] 使用缓存数据');
      this.setData({
        userInfo: cachedUserInfo,
        isLoggedIn: true,
        isLoading: false
      });
    }

    const db = wx.cloud.database();
    console.log('[Profile] 开始请求云数据库');
    
    // 即使有缓存也在后台更新数据
    const res = await db.collection('users').where({
      _openid: openid
    }).get();
    console.log('[Profile] 数据库返回:', res);
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
      console.log('[Profile] 用户不存在,准备创建');
      await this.createNewUser(openid);
    }
  },

  // 上传新头像
  async uploadAvatar() {
    try {
      console.log('开始上传头像...');
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image']
      });
      
      console.log('选择的图片:', res);
      const tempFilePath = res.tempFiles[0].tempFilePath;
      
      wx.showLoading({
        title: '上传中...',
      });
      
      // 上传到云存储
      const openid = getApp().globalData.openid;
      if (!openid) {
        console.error('上传头像错误: 用户未登录');
        wx.hideLoading();
        return;
      }
      
      console.log('上传头像到云存储, openid:', openid);
      const cloudPath = `avatars/${openid}_${Date.now()}.${tempFilePath.split('.').pop()}`;
      
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      });
      
      console.log('头像上传结果:', uploadRes);
      
      if (uploadRes.fileID) {
        // 更新用户头像
        await this.updateUserField('avatarUrl', uploadRes.fileID);
        console.log('用户头像已更新, fileID:', uploadRes.fileID);
      }
      
      wx.hideLoading();
      
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('上传头像失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },
  
  // 创建新用户
  async createNewUser(openid) {
    try {
      console.log('开始创建新用户...');
      const app = getApp();
      const openid = app.globalData.openid;
      
      if (!openid) {
        console.error('创建用户失败: 未获取到openid');
        return false;
      }
      
      // 默认头像路径
      const defaultAvatarPath = '/images/avatar.png';
      
      // 创建用户记录
      const db = wx.cloud.database();
      const result = await db.collection('users').add({
        data: {
          _openid: openid,
          nickName: '新用户',
          avatarUrl: defaultAvatarPath,
          introduction: '这个用户很懒，还没有填写介绍~',
          location: [116.397470, 39.908823],  // 北京默认位置
          createTime: db.serverDate()
        }
      });
      
      console.log('创建用户结果:', result);
      
      if (result._id) {
        // 获取并设置新创建的用户信息
        const userInfo = await db.collection('users').doc(result._id).get();
        this.setData({
          userInfo: userInfo.data
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('创建新用户失败:', error);
      return false;
    }
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
  startEditIntroduction(e) {
    const { content } = e.detail;
    const db = wx.cloud.database();
    const app = getApp();
    
    wx.showLoading({
      title: '保存中...'
    });
    
    db.collection('users').where({
      _openid: app.globalData.openid
    }).update({
      data: {
        introduction: content
      }
    }).then(() => {
      // 更新本地数据
      const userInfo = {...this.data.userInfo};
      userInfo.introduction = content;
      this.setData({ userInfo });
      
      // 更新缓存
      wx.setStorageSync('userProfile', userInfo);
      wx.setStorageSync('userProfileLastUpdate', Date.now());
      
      wx.hideLoading();
      wx.showToast({
        title: '已保存',
        icon: 'success'
      });
    }).catch(err => {
      console.error('更新介绍失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
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
        url: `/packages/media/video-player/index?fileID=${encodeURIComponent(media.fileID)}`
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