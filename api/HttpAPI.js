/* eslint-env node */

'use strict';

module.exports = {
  HttpAPI: HttpAPI
}

var serverAPI;
var infoEmitter;
var logProvider;

function HttpAPI(HomebridgeAPI, log, infoOptions, hbsConfig) {
    var pathLib = require('path');
    var apiLib = require(pathLib.resolve(__dirname, 'api.js'));
    serverAPI = new apiLib.API(HomebridgeAPI, log);

    var BridgeInfoEmitter = require(pathLib.resolve(require.resolve('../lib/HomebridgeInfoEmitter/BridgeInfoEmitter.js')));
    infoEmitter = BridgeInfoEmitter(infoOptions, HomebridgeAPI);
    infoEmitter.start();

    var LogProviderLib = require(pathLib.resolve(__dirname, 'LogProvider.js'));
    logProvider = new LogProviderLib.LogProvider(hbsConfig.log);
}

HttpAPI.prototype.bridgeInfo = function(res) {
    res.setHeader("Content-Type", "text/event-stream");

    // Send the current data to the client so he doesn't have to
    // wait for the next update before he get's something.
    res.write("data: " + JSON.stringify({'type': 'bridgeInfo', 'data': infoEmitter.initialInfo()}) + "\n\n");
    res.write("data: " + JSON.stringify({'type': 'bridgeUpdateAvailable', 'data': infoEmitter.lastUpdateCheck()}) + "\n\n");

    // From here we'll write whenever the emitter has something to say...
    infoEmitter.on('bridgeInfo', function(data) {
        res.write("data: " + JSON.stringify({'type': 'bridgeInfo', 'data': data}) + "\n\n");
    });

    infoEmitter.on('bridgeUpdateAvailable', function(data) {
        res.write("data: " + JSON.stringify({'type': 'bridgeUpdateAvailable', 'data': data}) + "\n\n");
    });
}


HttpAPI.prototype.bridgeConfig = function(res) {
    serverAPI.getBridgeConfig(function (json) {
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(json));
        res.end();
    });
}

HttpAPI.prototype.installedPlatforms = function(res) {
    serverAPI.getInstalledPlatforms(function (json) {
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(json));
        res.end();
    });
}

HttpAPI.prototype.accessories = function(res) {
    serverAPI.getInstalledAccessories(function (json) {
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(json));
        res.end();
    });
}

HttpAPI.prototype.searchPlugins = function(req, res) {
    var query = require('url').parse(req.url).query;
    serverAPI.getPluginsFromNPMS(query, function (json) {
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(json));
        res.end();
    });
}

HttpAPI.prototype.installedPlugins = function(res) {
    serverAPI.getInstalledPlugins(function (json) {
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(json));
        res.end();
    })
}

HttpAPI.prototype.saveBridgeConfig = function(req, res) {
    var body = '';
    req.on('data', function (data) {
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
            // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        var qs = require('querystring');
        var bodyJSON = qs.parse(body);
        serverAPI.saveBridgeConfig(bodyJSON, function (result, error) {
            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify({'success': result, 'msg': error}));
            res.end();
        });
    });
}

HttpAPI.prototype.createConfigBackup = function(res) {
    serverAPI.createConfigBackup(function (result, error) {
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({'success': result, 'msg': error}));
        res.end();
    });
}

HttpAPI.prototype.installPlugin = function(req, res) {
    var pluginName = require('url').parse(req.url).query;
    res.setHeader("Content-Type", "text/text");
    serverAPI.installPlugin(pluginName, function (success, msg, closed) {
        if (closed) {
            res.write("\n");
            res.write(JSON.stringify({'hbsAPIResult': {'success': success, 'msg': msg}}));
            res.end();
        } else {
            res.write(msg);
        }
    });
}

HttpAPI.prototype.updatePlugin = function(req, res) {
    var pluginName = require('url').parse(req.url).query;
    res.setHeader("Content-Type", "text/text");
    serverAPI.updatePlugin(pluginName, function (success, msg, closed) {
        if (closed) {
            res.write("\n");
            res.write(JSON.stringify({'hbsAPIResult': {'success': success, 'msg': msg}}));
            res.end();
        } else {
            res.write(msg);
        }
    });
}

HttpAPI.prototype.removePlugin = function(req, res) {
    var pluginName = require('url').parse(req.url).query;
    res.setHeader("Content-Type", "text/text");
    serverAPI.removePlugin(pluginName, function (success, msg, closed) {
        if (closed) {
            res.write("\n");
            res.write(JSON.stringify({'hbsAPIResult': {'success': success, 'msg': msg}}));
            res.end();
        } else {
            res.write(msg);
        }
    });
}

HttpAPI.prototype.restartHomebridge = function(res, config) {
    serverAPI.restartHomebridge(config, function (json) {
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(json));
        res.end();
    });
}

HttpAPI.prototype.removePlatformConfig = function(req, res) {
    var platformID = require('url').parse(req.url).query;
    serverAPI.removePlatformConfig(platformID, function(success, msg) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({'success': success, 'msg': msg}));
    })
}

HttpAPI.prototype.addPlatformConfig = function(req, res) {
    var body = '';
    req.on('data', function (data) {
        body += data;
        if (body.length > 1e6) {
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        var qs = require('querystring');
        var parts = qs.parse(body);
        serverAPI.addPlatformConfig(parts, function (json) {
            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify(json));
            res.end();
        });
    });
}

HttpAPI.prototype.updatePlatformConfig = function(req, res) {
    // This actually just combines calling removePlatformConfig and (if successful) addPlatformConfig.
    var body = '';
    req.on('data', function (data) {
        body += data;
        if (body.length > 1e6) {
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        var qs = require('querystring');
        var parts = qs.parse(body);
        serverAPI.removePlatformConfig(parts.configID, function(success, msg) {
            if (!success) {
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 400;
                res.end(JSON.stringify({"success": false, "msg": msg}));
                return;
            }
            delete parts.configID;
            serverAPI.addPlatformConfig(parts, function (json) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(json));
            });
        });
    });
}

HttpAPI.prototype.addAccessoryConfig = function(req, res) {
    var body = '';
    req.on('data', function (data) {
        body += data;
        if (body.length > 1e6) {
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        var qs = require('querystring');
        var parts = qs.parse(body);
        serverAPI.addAccessoryConfig(parts, function (json) {
            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify(json));
            res.end();
        });
    });
}


HttpAPI.prototype.logFileContent = function(req, res) {
    var page = require('url').parse(req.url).query;
    page = page * 1;   // make sure, this is not a string...
    res.setHeader("Content-Type", "application/json");
    logProvider.logFileContent(page, function (success, data) {
        if (success) {
            res.write(JSON.stringify({'success': success, 'data': data}));
            res.end();
        } else {
            res.write(JSON.stringify({'success': success, 'msg': data}));
            res.end();
        }
    });
}


HttpAPI.prototype.logFileTail = function(req, res) {
    var subscriptionID = require('url').parse(req.url).query;
    res.setHeader("Content-Type", "text/event-stream");
    logProvider.output(subscriptionID, function(success, line) {
        // console.log("logFileTail httpapi port " + require('util').inspect(req.socket.remotePort, { depth: null }));
        // console.log("logFileTail httpapi destroyed " + require('util').inspect(req.socket.destroyed, { depth: null }));
        // console.log("logFileTail httpapi called for " + subscriptionID);

        // Test if the socket is still living. If not, the client
        // has called event.close() on its EventSource object and doesn't want
        // to receive further messages; so we'll unsubscribe the subscriptionID
        // and end the connection.
        if (req.socket.destroyed === true) {
            logProvider.unsubscribe(subscriptionID);
            res.end();
            return;
        }

        // Send the message to the client.
        if (success) {
            res.write("data: " + JSON.stringify({'success': true, 'data': line}) + "\n\n");
        } else {
            res.write("data: " + JSON.stringify({'success': false, 'data': line}) + "\n\n");
            res.end();
        }
    });
}

HttpAPI.prototype.subscribeToLogFileTail = function(res) {
    logProvider.subscribe(function (success, msg) {
        res.setHeader("Content-Type", "application/json");
        if (!success) {
            res.write(JSON.stringify({'success': false, 'msg': msg}));
            res.end();
            return;
        }
        res.write(JSON.stringify({'success': true, 'subscriptionID': msg}));
        res.end();
    });
}

HttpAPI.prototype.unsubscribeFromLogFileTail = function(req, res) {
    var subscriptionID = require('url').parse(req.url).query;
    logProvider.unsubscribe(subscriptionID);
    res.setHeader("Content-Type", "application/json");
    var msg = 'Unsubscribed ' + subscriptionID;
    res.write(JSON.stringify({'msg': msg}));
    res.end();
}
