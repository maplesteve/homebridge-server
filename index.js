/* eslint-env node */
var HomebridgeAPI;

module.exports = function(homebridge) {
    HomebridgeAPI = homebridge;
    homebridge.registerPlatform("homebridge-server", "Server", ServerPlatform);
    homebridge.registerAccessory("homebridge-server", "ServerAcc", ServerAccessory);
}

function ServerAccessory(log, config) {
    this.log = log;
    this.name = config["name"];
 }

 ServerAccessory.prototype.getServices = function() {
     return [];
 }

function ServerPlatform(log, config) {
    var express = require('express');
    var server = express();

    server.listen(config.port, function() {
      var os = require('os');
      var ifaces = os.networkInterfaces();

      Object.keys(ifaces).forEach(function (ifname) {
        ifaces[ifname].forEach(function (iface) {
          if ('IPv4' !== iface.family || iface.internal !== false) {
            return;
          }
          log("is listening on: http://%s:%s", iface.address, config.port);
        });
      });
    });


    var bodyParser = require('body-parser');
    server.use(bodyParser.urlencoded({ extended: false }))
    server.use(bodyParser.json());

    var path = require('path');
    var ConfigManagerLib = require(path.resolve(__dirname, 'api', 'ConfigManager.js'));
    var confMgr = new ConfigManagerLib.ConfigManager(HomebridgeAPI);

    var bridgeConfigRouterLib = require(path.resolve(__dirname, 'api', 'routes', 'bridgeConfig.js'));
    server.use('/api/bridgeConfig', bridgeConfigRouterLib(HomebridgeAPI, confMgr));

    var platformsRouterLib = require(path.resolve(__dirname, 'api', 'routes', 'platforms.js'));
    server.use('/api/platforms', platformsRouterLib(HomebridgeAPI, confMgr));

    var accessoriesRouterLib = require(path.resolve(__dirname, 'api', 'routes', 'accessories.js'));
    server.use('/api/accessories', accessoriesRouterLib(confMgr));

    var pluginsRouterLib = require(path.resolve(__dirname, 'api', 'routes', 'plugins.js'));
    server.use('/api/plugins', pluginsRouterLib());

    var logfilesRouterLib = require(path.resolve(__dirname, 'api', 'routes', 'logfiles.js'));
    server.use('/api/logfiles', logfilesRouterLib(config.log));

    var restartRouterLib = require(path.resolve(__dirname, 'api', 'routes', 'restart.js'));
    server.use('/api/restart', restartRouterLib(HomebridgeAPI, config));

    var infoOptions = {
        "updateFrequency" : 10000,
        "updateCheckFrequency" : 3600000
    }
    var bridgeInfoRouterLib = require(path.resolve(__dirname, 'api', 'routes', 'bridgeInfo.js'));
    server.use('/api/bridgeInfo', bridgeInfoRouterLib(HomebridgeAPI, infoOptions));


    server.use(express.static(path.resolve(__dirname, 'site')));
}

ServerPlatform.prototype.accessories = function(callback) {
    this.accessories = [];
    callback(this.accessories);
}
