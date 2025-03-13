Component({
  properties: {
    src: {
      type: String,
      value: ''
    },
    size: {
      type: Number,
      value: 40
    },
    borderWidth: {
      type: Number,
      value: 2
    },
    borderColor: {
      type: String,
      value: '#ffffff'
    }
  },
  
  data: {
    error: false
  },
  
  methods: {
    onError() {
      this.setData({
        error: true
      });
    }
  }
}) 