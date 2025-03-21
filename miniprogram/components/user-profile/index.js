Component({
  properties: {
    userInfo: {
      type: Object,
      value: {}
    },
    editable: {
      type: Boolean,
      value: false
    }
  },

  data: {
    introContent: '',
    isEditing: false
  },

  observers: {
    'userInfo.introduction': function(introduction) {
      this.setData({
        introContent: introduction || ''
      });
    }
  },

  methods: {
    // 编辑头像
    editAvatar() {
      if (!this.properties.editable) return;
      this.triggerEvent('editAvatar');
    },

    // 编辑昵称
    editNickname() {
      if (!this.properties.editable) return;
      this.triggerEvent('editNickname');
    },

    // 处理个人介绍获得焦点
    onIntroFocus() {
      if (!this.properties.editable) return;
      this.setData({
        isEditing: true
      });
    },

    // 处理个人介绍输入
    onIntroInput(e) {
      this.setData({
        introContent: e.detail.value
      });
    },

    // 处理个人介绍失去焦点
    onIntroBlur() {
      if (!this.properties.editable) return;
      this.setData({
        isEditing: false
      });
      if (this.data.introContent !== this.properties.userInfo.introduction) {
        this.triggerEvent('editIntroduction', {
          content: this.data.introContent
        });
      }
    },

    // 编辑联系方式
    editContact(e) {
      if (!this.properties.editable) return;
      const { type } = e.currentTarget.dataset;
      this.triggerEvent('editContact', { type });
    },

    // 预览媒体
    previewMedia(e) {
      const { index } = e.currentTarget.dataset;
      this.triggerEvent('previewMedia', { index });
    },

    // 上传媒体
    uploadMedia() {
      if (!this.properties.editable) return;
      this.triggerEvent('uploadMedia');
    },

    // 删除媒体
    deleteMedia(e) {
      if (!this.properties.editable) return;
      const { index } = e.currentTarget.dataset;
      this.triggerEvent('deleteMedia', { index });
    }
  }
}); 