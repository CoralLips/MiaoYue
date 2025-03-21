Component({
  properties: {
    placeholder: {
      type: String,
      value: '搜索用户、商家或活动'
    },
    value: {
      type: String,
      value: ''
    }
  },

  data: {
    focused: false
  },

  methods: {
    onInput(e) {
      const value = e.detail.value;
      this.triggerEvent('input', { value });
    },

    onFocus() {
      this.setData({ focused: true });
      this.triggerEvent('focus');
    },

    onBlur() {
      this.setData({ focused: false });
      this.triggerEvent('blur');
    },

    onClear() {
      this.setData({ value: '' });
      this.triggerEvent('input', { value: '' });
      this.triggerEvent('clear');
    }
  }
}); 