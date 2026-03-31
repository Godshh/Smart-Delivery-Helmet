// Simple event bus implementation for Vue 3

const eventBus = {
  events: {},
  
  // Register an event handler
  on(event, callback) {
    if (typeof callback !== 'function') {
      console.error('Event handler must be a function');
      return;
    }
    
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },
  
  // Remove an event handler
  off(event, callback) {
    if (!this.events[event]) return;
    
    if (callback) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    } else {
      // If no callback is provided, remove all handlers for this event
      delete this.events[event];
    }
  },
  
  // Trigger an event
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        if (typeof callback === 'function') {
          callback(...args);
        } else {
          console.error('Event handler is not a function:', callback);
        }
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });
  }
};

export default eventBus;