// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: wx.cloud.DYNAMIC_CURRENT_ENV,
        traceUser: true,
      });
    }

    this.globalData = {
      openid: null
    };
    
    // 登录获取openid
    this.getOpenid();
  },
  
  // 获取用户openid
  getOpenid: function(callback) {
    const that = this;
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        console.log('[云函数] [login] 调用成功', res);
        that.globalData.openid = res.result.openid;
        if (callback && typeof callback === 'function') {
          callback(res.result.openid);
        }
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err);
        if (callback && typeof callback === 'function') {
          callback(null);
        }
      }
    });
  },
  
  // 更新用户位置
  updateUserLocation: function() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const { latitude, longitude } = res;
        
        // 上传到云数据库
        const db = wx.cloud.database();
        db.collection('user_locations').where({
          _openid: this.globalData.openid
        }).count().then(countRes => {
          if (countRes.total === 0) {
            // 新增位置记录
            db.collection('user_locations').add({
              data: {
                location: {
                  latitude,
                  longitude
                },
                nickName: '用户' + this.globalData.openid.substring(0, 4),
                avatarUrl: '',
                visible: true,
                lastUpdateTime: db.serverDate()
              }
            }).then(() => {
              console.log('位置信息创建成功');
            }).catch(err => {
              console.error('位置信息创建失败', err);
            });
          } else {
            // 更新位置记录
            db.collection('user_locations').where({
              _openid: this.globalData.openid
            }).update({
              data: {
                location: {
                  latitude,
                  longitude
                },
                lastUpdateTime: db.serverDate()
              }
            }).then(() => {
              console.log('位置信息更新成功');
            }).catch(err => {
              console.error('位置信息更新失败', err);
            });
          }
        });
      },
      fail: (err) => {
        console.error('获取位置失败', err);
      }
    });
  }
});
