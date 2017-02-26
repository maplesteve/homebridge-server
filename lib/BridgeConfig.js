/* eslint-env node */

'use strict';

module.exports = {
  BridgeConfig: BridgeConfig
}

var _configPath = "";
var _bridgeConfig = {};

function BridgeConfig(path) {
    _configPath = path;
    var config = require(_configPath);
    _bridgeConfig.username = config.username;
    _bridgeConfig.pin = config.pin;
    _bridgeConfig.name = config.name;
    _bridgeConfig.port = config.port;
}


BridgeConfig.prototype.setUsername = function(newUsername, callback) {
    if(/^([0-9A-F]{2}[:]){5}([0-9A-F]{2})$/.test(newUsername) === false) {
        callback(false, "Invalid username! (Style: AA:BB:77:88:22:11)");
        return;
    }
    _bridgeConfig.username = newUsername;
    callback(true, newUsername);
}

BridgeConfig.prototype.username = function() {
    return _bridgeConfig.username;
}


BridgeConfig.prototype.setPin = function(newPin, callback) {
    if(/^(([0-9]{3})[-]([0-9]{2})[-]([0-9]{3}))$/.test(newPin) === false) {
        callback(false, "Invalid pin! (Style: 111-22-333)");
        return;
    }
    _bridgeConfig.pin = newPin;
    callback(true, newPin);
}

BridgeConfig.prototype.pin = function() {
    return _bridgeConfig.pin;
}


BridgeConfig.prototype.setName = function(newName, callback) {
    _bridgeConfig.name = newName;
    callback(true, newName);
}

BridgeConfig.prototype.name = function() {
    return _bridgeConfig.name;
}


BridgeConfig.prototype.setPort = function(newPort, callback) {
    _bridgeConfig.port = newPort;
    callback(true, newPort);
}

BridgeConfig.prototype.name = function() {
    return _bridgeConfig.name;
}


BridgeConfig.prototype.update = function(newProperties, callback) {
    if (newProperties.hasOwnProperty('name')) {
        this.setName(newProperties.name, function(success, msg) {
            if (!success) {
                callback(false, msg);
                return;
            }
        });
    }
    if (newProperties.hasOwnProperty('username')) {
        this.setUsername(newProperties.username, function(success, msg) {
            if (!success) {
                callback(false, msg);
                return;
            }
        });
    }
    if (newProperties.hasOwnProperty('pin')) {
        this.setPin(newProperties.pin, function(success, msg) {
            if (!success) {
                callback(false, msg);
                return;
            }
        });
    }
    if (newProperties.hasOwnProperty('port')) {
        this.setPort(newProperties.port, function(success, msg) {
            if (!success) {
                callback(false, msg);
                return;
            }
        });
    }

    callback(true, _bridgeConfig);
}


BridgeConfig.prototype.config = function() {
    return _bridgeConfig;
}
