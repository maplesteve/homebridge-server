/* eslint-env node */

'use strict';
var express = require('express');
var router = express.Router();

var confMgr;

function sendError(res, msg) {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 400;
    res.write(JSON.stringify({"error": msg}));
    res.end();
}

function preparePlatformConfig(res, newConfig) {
    var newConfigPartString = JSON.stringify(newConfig.accessoryConfig);
    var newConfigPartClean = newConfigPartString.replace(/\\/g, "").replace(/\'/g, "\"");

    try {
        var newConfigJSON = JSON.parse(newConfigPartClean);
        newConfigJSON.accessory = newConfig.plugin;
        delete newConfigJSON.configID;
        return newConfigJSON;
    } catch (e) {
        sendError(res, 'Invalid JSON.');
        return;
    }
}

module.exports = function(configManager) {
    confMgr = configManager;

    router.route('/')
        .get(function(req, res) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify(confMgr.accessories()));
            res.end();
        })

        .post(function(req, res) {
            var newConfigJSON = preparePlatformConfig(res, req.body);
            confMgr.addAccessory(newConfigJSON, function(success, msg) {
                if (!success) {
                    sendError(res, msg.error);
                    return;
                }
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 201;
                res.write(JSON.stringify({"accessoryID": msg.accessoryID}));
                res.end();
                return;
            });
        })

    router.route('/:accessoryID')
        .get(function(req, res) {
            var accessoryID = req.params.accessoryID;
            var result = confMgr.accessory(accessoryID);
            if (result.success) {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(result.data));
                res.end();
            } else {
                res.statusCode = 404;
                res.end();
            }
        })

        .put(function(req, res) {
            var accessoryID = req.params.accessoryID;
            confMgr.removeAccessory(accessoryID, function(success, msg) {
                if (!success) {
                    res.setHeader("Content-Type", "application/json");
                    res.statusCode = 404;
                    res.end(JSON.stringify({"error": msg}));
                    return;
                }

                var newAccessoryConfig = preparePlatformConfig(res, req.body);
                confMgr.addAccessory(newAccessoryConfig, function(success, msg) {
                    if (!success) {
                        sendError(res, msg.error);
                        return;
                    }
                    res.setHeader("Content-Type", "application/json");
                    res.statusCode = 201;
                    res.write(JSON.stringify({"accessoryID": msg.accessoryID}));
                    res.end();
                    return;
                });
            });
        })

        .delete(function(req, res) {
            var accessoryID = req.params.accessoryID;
            confMgr.removeAccessory(accessoryID, function(success, msg) {
                res.setHeader("Content-Type", "application/json");
                if (success) {
                    res.statusCode = 204;
                } else {
                    res.statusCode = 404;
                    res.write(JSON.stringify({'error': msg}));
                }
                res.end();
            })
        })

    return router;
}
