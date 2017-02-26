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

    var infoOptions = {
        "updateFrequency" : 10000,
        "updateCheckFrequency" : 3600000
    }
    var bridgeInfoRouterLib = require(path.resolve(__dirname, 'api', 'routes', 'bridgeInfo.js'));
    server.use('/api/bridgeInfo', bridgeInfoRouterLib(HomebridgeAPI, infoOptions));


    server.get(/.*/, function (req, res) {
        handleContentRequest(req, res);
    })


    var AssetManagerLib = require(path.resolve(__dirname, 'api', 'AssetManager.js'));
    var Assets = new AssetManagerLib.AssetManager(log);

    function handleContentRequest(req, res) {
        log("handleContentRequest: " + req.url);
        // Assets.reload();   // uncomment when debugging to force reload without restarting the server.
        res.setHeader("Content-Type", "text/html");
        switch (req.url) {
            case '/':
                res.end(Assets.headerHTML + Assets.navBarHTML + Assets.mainHTML + Assets.footerHTML);
                break;
            case '/listInstallablePlugins':
                res.end(Assets.headerHTML + Assets.navBarHTML + Assets.pluginsHTML + Assets.footerHTML);
                break;
            case '/addPlatform':
                res.end(Assets.headerHTML + Assets.navBarHTML + Assets.addPlatformHTML + Assets.footerHTML);
                break;
            case '/addAccessory':
                res.end(Assets.headerHTML + Assets.navBarHTML + Assets.addAccessoryHTML + Assets.footerHTML);
                break;
            case '/showLog':
                res.end(Assets.headerHTML + Assets.navBarHTML + Assets.showLogHTML + Assets.footerHTML);
                break;
            case '/style.css':
                log("serving style.css");
                res.setHeader("Content-Type", "text/css");
                res.end(Assets.styleCSS);
                break;
            case '/js/global.js':
                log("serving /js/global.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.globalJS);
                break;
            case '/js/main.js':
                log("serving /js/main.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.mainJS);
                break;
            case '/js/plugins.js':
                log("serving /js/plugins.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.pluginsJS);
                break;
            case '/js/showLog.js':
                log("serving /js/showLog.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.showLogJS);
                break;
            case '/js/addAccessory.js':
                log("serving /js/addAccessory.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.addAccessoryJS);
                break;
            case '/js/addPlatform.js':
                log("serving /js/addPlatform.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.addPlatformJS);
                break;
            case '/js/footer.js':
                log("serving /js/footer.js");
                res.setHeader("Content-Type", "text/javascript");
                res.end(Assets.footerJS);
                break;
            default:
                log("unhandled request: " + req.url);
                res.statusCode = 404;
                res.end();
        }
    }
}

ServerPlatform.prototype.accessories = function(callback) {
    this.accessories = [];
    callback(this.accessories);
}
