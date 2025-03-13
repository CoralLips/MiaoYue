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

    // 编辑介绍
    editIntroduction() {
      if (!this.properties.editable) return;
      this.triggerEvent('editIntroduction');
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