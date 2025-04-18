/ tests/chrome-mock.js
const chrome = {
  storage: {
    local: {
      _data: {},
      get: function(keys, callback) {
        if (typeof keys === 'string') {
          callback({ [keys]: this._data[keys] });
        } else if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            result[key] = this._data[key];
          });
          callback(result);
        } else if (typeof keys === 'object') {
          const result = {};
          Object.keys(keys).forEach(key => {
            result[key] = this._data[key] !== undefined ? this._data[key] : keys[key];
          });
          callback(result);
        } else {
          callback(this._data);
        }
      },
      set: function(items, callback) {
        Object.assign(this._data, items);
        if (callback) callback();
      },
      clear: function(callback) {
        this._data = {};
        if (callback) callback();
      },
      // For testing purposes
      _reset: function() {
        this._data = {};
      }
    }
  },
  runtime: {
    lastError: null,
    setLastError: function(error) {
      this.lastError = { message: error };
    },
    clearLastError: function() {
      this.lastError = null;
    }
  },
  tabs: {
    create: function(options, callback) {
      if (callback) callback({ id: 1, url: options.url });
    }
  }
};

// Make it globally available for tests
global.chrome = chrome;

module.exports = chrome;