Component({
  properties: {
    markers: {
      type: Array,
      value: []
    }
  },
  
  data: {
  },
  
  methods: {
    onMarkerTap(e) {
      const markerId = e.markerId;
      this.triggerEvent('markertap', { markerId });
    }
  }
}) 