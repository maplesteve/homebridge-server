/* eslint-env node, es6 */

'use strict';

module.exports = {
  HBDevices: HBDevices
}

var HBDevice = require('./HBDevice').HBDevice;

function HBDevices() {}

HBDevices.prototype._devices = [];

HBDevices.prototype.clear = function() {
    this._devices = [];
}

HBDevices.prototype.configs = function() {
    var configs = [];
    for (var pf in this._devices) {
        configs.push(this._devices[pf].config());
    }
    return configs;
}

HBDevices.prototype.devices = function() {
    return this._devices;
}

HBDevices.prototype.get = function(deviceID) {
    for (var pos in this._devices) {
        if (this._devices[pos].id() === deviceID) {
            return (this._devices[pos]);
        }
    }
    return null;
}

HBDevices.prototype.add = function(newDeviceConfig, callback) {
    var newDevice = new HBDevice(newDeviceConfig);
    if (newDevice) {
        this._devices.push(newDevice);
        callback(true, newDevice.id());
        return;
    }
    callback(false, "Could not create new device.");
}

HBDevices.prototype.remove = function(deviceID, callback) {
    var posOfRemoveCandidate = -1;
    for (var pos in this._devices) {
        if (this._devices[pos].id() === deviceID) {
            posOfRemoveCandidate = pos;
        }
    }
    if (posOfRemoveCandidate == -1) {
        callback(false, "Invalid ID: " + deviceID);
        return;
    }
    this._devices.splice(posOfRemoveCandidate, 1);
    callback(true, "");
}
