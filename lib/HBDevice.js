/* eslint-env node, es6 */

'use strict';

class HBDevice {
  constructor(config){
      this._meta = {
          "isActive": false,
          "pluginID": ""
      }
      this._meta.pluginName = config.platform != undefined ? config.platform : config.accessory;

      this.setConfig(config);
  }

  config() {
      return this._config;
  }

  id() {
      return this._meta.id;
  }

  setConfig(data) {
      this._config = data;
      this._meta.id = this.calculateID();
  }

  calculateID() {
      var crypto = require('crypto');
      var hash = crypto.createHash('sha256');
      hash.update(JSON.stringify(this._config));
      return hash.digest('hex');
  }
}

module.exports = {
    HBDevice: HBDevice
}
