/* eslint-env node */

'use strict';
var express = require('express');
var router = express.Router();

var confMgr;

function preparePlatformConfig(res, newConfig) {
    var newConfigPartString = JSON.stringify(newConfig.platformConfig);
    var newConfigPartClean = newConfigPartString.replace(/\\/g, "").replace(/\'/g, "\"");
    try {
        var newConfigJSON = JSON.parse(newConfigPartClean);
        newConfigJSON.platform = newConfig.plugin;
        delete newConfigJSON.configID;
        return newConfigJSON;
    } catch (e) {
        res.status(400).json({"error": 'Invalid JSON.'});
        return;
    }
}

module.exports = function(hbAPI, configManager) {
    confMgr = configManager;

    router.route('/')
        .get(function(req, res) {
            res.status(200).json(confMgr.platforms());
        })

        .post(function(req, res) {
            var newConfigJSON = preparePlatformConfig(res, req.body);
            confMgr.addPlatform(newConfigJSON, function(success, msg) {
                if (success) {
                    res.status(201).json({"platformID": msg.platformID});
                } else {
                    res.status(400).json({"error": msg.error});
                }
            });
        })

    router.route('/:platformId')
        .get(function(req, res) {
            var platformID = req.params.platformId;
            confMgr.platform(platformID, function(success, data) {
                if (success) {
                    res.status(200).json(data);
                } else {
                    res.status(404).end();
                }
            });
        })

        .put(function(req, res) {
            var platformID = req.params.platformId;
            confMgr.removePlatform(platformID, function(success, msg) {
                if (!success) {
                    res.status(404).json({"error": msg});
                    return;
                }

                var newPlatformConfig = preparePlatformConfig(res, req.body);
                confMgr.addPlatform(newPlatformConfig, function(success, msg) {
                    if (success) {
                        res.status(201).json({"platformID": msg.platformID});
                    } else {
                        res.status(400).json({"error": msg.error});
                    }
                });
            });
        })

        .delete(function(req, res) {
            var platformID = req.params.platformId;
            confMgr.removePlatform(platformID, function(success, msg) {
                res.setHeader("Content-Type", "application/json");
                if (success) {
                    res.status(204).end();
                } else {
                    res.status(404).json({"error": msg});
                }
            })
        })

    return router;
}
