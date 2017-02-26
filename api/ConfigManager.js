/* eslint-env node */

'use strict';

module.exports = {
  ConfigManager: ConfigManager
}

// Internals
var homebridgeAPI;

//
var _config = {};

var bridgeConfig;
var Platforms;
var Accessories;

/**
 * [ConfigManager description]
 * @param {[type]} hbAPI [description]
 */
function ConfigManager(hbAPI) {
    homebridgeAPI = hbAPI;

    var pathLib = require('path');
    var bridgeConfigLib = require(pathLib.resolve(__dirname, '..', 'lib', 'BridgeConfig.js'));
    bridgeConfig = new bridgeConfigLib.BridgeConfig(homebridgeAPI.user.configPath());

    var HBDevicesLib = require('../lib/HBDevices.js');
    Platforms = new HBDevicesLib.HBDevices();
    Accessories = new HBDevicesLib.HBDevices();

    loadConfig(hbAPI);
}

/**
 * [config description]
 * @return {[type]} [description]
 */
ConfigManager.prototype.config = function() {
    return _config;
}

/**
 * [platformsJSON description]
 * @return {[type]} [description]
 */
ConfigManager.prototype.platforms = function() {
    return Platforms.devices();
}

ConfigManager.prototype.platform = function(platformID) {
    var pf = Platforms.get(platformID);
    if (pf) {
        // TODO: no reason for JSON here...
        return ({"success": true, "data": pf});
    }
    // TODO: no reason for JSON here...
    return ({"success": false, "error": "Invalid configDigest: " + platformID});
}

ConfigManager.prototype.addPlatform = function(platformConfig, callback) {
    var me = this;
    Platforms.add(platformConfig, function(success, id) {
        if (success) {
            me.save(callback, {"platformID": id});
        }
    })
}

ConfigManager.prototype.removePlatform = function(platformConfigID, callback) {
    var me = this;
    Platforms.remove(platformConfigID, function(success, error) {
        if (!success) {
            callback(false, error);
            return;
        }
        me.save(callback);
    })
}



ConfigManager.prototype.accessories = function() {
    return Accessories.devices();
}

ConfigManager.prototype.accessory = function(accessoryID) {
    var acc = Accessories.get(accessoryID);
    if (acc) {
        // TODO: no reason for JSON here...
        return ({"success": true, "data": acc});
    }
    // TODO: no reason for JSON here...
    return ({"success": false, "error": "Invalid configDigest: " + accessoryID});
}

ConfigManager.prototype.addAccessory = function(accessoryConfig, callback) {
    var me = this;
    Accessories.add(accessoryConfig, function(success, id) {
        if (success) {
            me.save(callback, {"accessoryID": id});
            return;
        }
        callback(false, "ConfigManager.addAccessory failed.");
    })
}

ConfigManager.prototype.removeAccessory = function(accessoryID, callback) {
    var me = this;
    Accessories.remove(accessoryID, function(success, error) {
        if (!success) {
            callback(false, error);
            return;
        }
        me.save(callback);
    })
}



ConfigManager.prototype.updateBridgeConfig = function(changes, callback) {
    var me = this;
    bridgeConfig.update(changes, function(succes, msg) {
        if (succes) {
            _config.bridge = msg;
            me.save(callback);
            return;
        }
        callback(false, msg);
    })
}


ConfigManager.prototype.save = function(callback, option) {
    var fs = require('fs');
    // check if config file can be written
    fs.access(homebridgeAPI.user.configPath(), fs.R_OK | fs.W_OK, function(err) {
        if (err) {
            callback(false, "No rights to write config.json.");
            return;
        }
        // save
        var newFileName = homebridgeAPI.user.configPath().replace('config.json', 'config_new.json');
        var cleanConfig = JSON.stringify(_config, internalPropertiesReplacer, 4);
        var newConfig = {};
        newConfig.bridge = bridgeConfig;
        newConfig.platforms = Platforms.configs();
        newConfig.accessories = Accessories.configs();
        fs.writeFile(newFileName, cleanConfig, "utf8", function() {
            if (option) {
                callback(true, option);
                return;
            }
            callback(true, "Saved config.json. \nPlease restart Homebridge to activate your changes.");
            return;
        });
    });
}


function internalPropertiesReplacer(key, value) {
  if (key.startsWith('hbServer_')) {
    return undefined;
  }
  return value;
}

ConfigManager.prototype.backupConfigFile = function(callback) {
    var fs = require('fs');
    fs.readFile(homebridgeAPI.user.configPath(), function (err, data) {
        if (err) {
            callback(false, err + " ");
            return;
        }
        var newFileName = homebridgeAPI.user.configPath() + ".bak";
        fs.writeFile(newFileName, data, function(err) {
            if (err) {
                callback(false, err + " ");
                return;
            }
            callback(true, newFileName);
            return;
        })
    });
}

/**
 * Reads the config file of the homebridge instance.
 * @param  {[type]} HomebridgeAPI [description]
 * @return {[type]}               [description]
 */
function loadConfig() {
    // Start clean
    Platforms.clear();
    Accessories.clear();

    _config = require(homebridgeAPI.user.configPath());
    var _platforms = _config.platforms != undefined ? _config.platforms : {};

    var activePlatforms = [];
    var platformPluginMap = [];
    for (var fullName in homebridgeAPI._platforms) {
        var parts = fullName.split('.');
        var pluginName = parts[0];
        var platform = parts[1];
        activePlatforms.push(platform);
        platformPluginMap[platform] = pluginName;
    }
    for (var pf_ID in _platforms) {
        var pf = _platforms[pf_ID];
        Platforms.add(pf, function(success, id) {
            if (!success) {
                console.log("loadConfig error: " + id);       // eslint-disable-line
            }
        });

        // _platforms[pf_ID]["hbServer_pluginName"] = platformPluginMap[pf.platform];
        // if (activePlatforms.indexOf(pf.platform) === -1) {
        //     _platforms[pf_ID]["hbServer_active_flag"] = 0;
        // } else {
        //     _platforms[pf_ID]["hbServer_active_flag"] = 1;
        // }
    }

    var _accessories = _config.accessories != undefined ? _config.accessories : {};
    for (var acc_ID in _accessories) {
        var acc = _accessories[acc_ID];
        Accessories.add(acc, function(success, id) {
            if (!success) {
                console.log("loadConfig error: " + id);       // eslint-disable-line
            }
        });
    }
}
