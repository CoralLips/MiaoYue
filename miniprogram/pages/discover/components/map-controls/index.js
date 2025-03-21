Component({
  methods: {
    onFilterTap() {
      this.triggerEvent('filter');
    },

    onRefreshTap() {
      this.triggerEvent('refresh');
    },

    onLocationTap() {
      this.triggerEvent('location');
    }
  }
}); 