Component({
  properties: {
    visible: Boolean,
    user: {
      type: Object,
      value: null
    }
  },
  methods: {
    onClose() {
      this.triggerEvent('close');
    },
    onViewDetail() {
      this.triggerEvent('detail', { user: this.properties.user });
    },
    stopPropagation() {
      // 阻止事件冒泡
    }
  }
}); 