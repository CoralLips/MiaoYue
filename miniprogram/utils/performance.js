// 性能监控工具
class Performance {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
  }

  // 记录时间点
  mark(name) {
    this.marks.set(name, Date.now());
  }

  // 测量两个时间点之间的时间
  measure(name, startMark, endMark) {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);
    
    if (!start || !end) {
      console.error('Performance marks not found:', { startMark, endMark });
      return;
    }

    const duration = end - start;
    this.recordMetric(name, duration);
    return duration;
  }

  // 记录性能指标
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push(value);
  }

  // 获取性能指标统计
  getMetricStats(name) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(values.length * 0.95)];

    return {
      name,
      count: values.length,
      average: avg,
      min: Math.min(...values),
      max: Math.max(...values),
      p95
    };
  }

  // 获取所有性能指标
  getAllMetrics() {
    const result = {};
    for (const name of this.metrics.keys()) {
      result[name] = this.getMetricStats(name);
    }
    return result;
  }

  // 清理性能数据
  clear() {
    this.metrics.clear();
    this.marks.clear();
  }
}

const performance = new Performance();

// 页面性能装饰器
const pagePerformance = (pageConfig) => {
  const originalOnLoad = pageConfig.onLoad;
  const originalOnReady = pageConfig.onReady;

  pageConfig.onLoad = function(options) {
    performance.mark(`${this.route}_onLoad_start`);
    if (originalOnLoad) {
      originalOnLoad.call(this, options);
    }
  };

  pageConfig.onReady = function() {
    performance.mark(`${this.route}_onReady_end`);
    performance.measure(
      `${this.route}_load_time`,
      `${this.route}_onLoad_start`,
      `${this.route}_onReady_end`
    );
    if (originalOnReady) {
      originalOnReady.call(this);
    }
  };

  return pageConfig;
};

module.exports = {
  performance,
  pagePerformance
}; 