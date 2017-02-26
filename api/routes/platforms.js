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
    var newConfigPartString = JSON.stringify(newConfig.platformConfig);
    var newConfigPartClean = newConfigPartString.replace(/\\/g, "").replace(/\'/g, "\"");
    try {
        var newConfigJSON = JSON.parse(newConfigPartClean);
        newConfigJSON.platform = newConfig.plugin;
        delete newConfigJSON.configID;
        return newConfigJSON;
    } catch (e) {
        sendError(res, 'Invalid JSON.');
        return;
    }
}

module.exports = function(hbAPI, configManager) {
    confMgr = configManager;

    router.route('/')
        .get(function(req, res) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify(confMgr.platforms()));
            res.end();
        })

        .post(function(req, res) {
            var newConfigJSON = preparePlatformConfig(res, req.body);
            confMgr.addPlatform(newConfigJSON, function(success, msg) {
                if (!success) {
                    sendError(res, msg.error);
                    return;
                }
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 201;
                res.write(JSON.stringify({"platformID": msg.platformID}));
                res.end();
                return;
            });
        })

    router.route('/:platformId')
        .get(function(req, res) {
            var platformID = req.params.platformId;
            var result = confMgr.platform(platformID);
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
            var platformID = req.params.platformId;
            confMgr.removePlatform(platformID, function(success, msg) {
                if (!success) {
                    res.setHeader("Content-Type", "application/json");
                    res.statusCode = 404;
                    res.end(JSON.stringify({"error": msg}));
                    return;
                }

                var newPlatformConfig = preparePlatformConfig(res, req.body);
                confMgr.addPlatform(newPlatformConfig, function(success, msg) {
                    if (!success) {
                        sendError(res, msg.error);
                        return;
                    }
                    res.setHeader("Content-Type", "application/json");
                    res.statusCode = 201;
                    res.write(JSON.stringify({"platformID": msg.platformID}));
                    res.end();
                    return;
                });
            });
        })

        .delete(function(req, res) {
            var platformID = req.params.platformId;
            confMgr.removePlatform(platformID, function(success, msg) {
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
