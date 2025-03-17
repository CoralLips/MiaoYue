// 事件总线
class EventBus {
  constructor() {
    this.events = new Map();
  }

  // 订阅事件
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);
  }

  // 取消订阅
  off(event, callback) {
    if (!this.events.has(event)) return;
    if (!callback) {
      this.events.delete(event);
      return;
    }
    this.events.get(event).delete(callback);
  }

  // 触发事件
  emit(event, data) {
    if (!this.events.has(event)) return;
    for (const callback of this.events.get(event)) {
      try {
        callback(data);
      } catch (e) {
        console.error(`Event callback error: ${e.message}`);
      }
    }
  }

  // 清空所有事件
  clear() {
    this.events.clear();
  }
}

const eventBus = new EventBus();
module.exports = eventBus; 