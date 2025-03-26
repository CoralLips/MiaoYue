Component({
  properties: {
    visible: Boolean,
    currentFilter: String
  },
  data: {
    filters: [
      { type: 'all', text: '全部' },
      { type: 'user', text: '用户' },
      { type: 'business', text: '商家' },
      { type: 'event', text: '活动' }
    ]
  },
  methods: {
    onFilterSelect(e) {
      const type = e.currentTarget.dataset.type;
      this.triggerEvent('select', { type });
    },
    onClose() {
      this.triggerEvent('close');
    },
    stopPropagation() {
      // 阻止事件冒泡
    }
  }
}); 