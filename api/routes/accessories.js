/* eslint-env node */

'use strict';
var express = require('express');
var router = express.Router();

var confMgr;

function preparePlatformConfig(res, newConfig) {
    var newConfigPartString = JSON.stringify(newConfig.accessoryConfig);
    var newConfigPartClean = newConfigPartString.replace(/\\/g, "").replace(/\'/g, "\"");

    try {
        var newConfigJSON = JSON.parse(newConfigPartClean);
        newConfigJSON.accessory = newConfig.plugin;
        delete newConfigJSON.configID;
        return newConfigJSON;
    } catch (e) {
        res.status(400).json({"error": 'Invalid JSON.'});
        return;
    }
}

module.exports = function(configManager) {
    confMgr = configManager;

    router.route('/')
        .get(function(req, res) {
            res.status(200).json(confMgr.accessories());
        })

        .post(function(req, res) {
            var newConfigJSON = preparePlatformConfig(res, req.body);
            confMgr.addAccessory(newConfigJSON, function(success, msg) {
                if (success) {
                    res.status(201).json({"accessoryID": msg.accessoryID});
                } else {
                    res.status(400).json({"error": msg.error});
                }
            });
        })

    router.route('/:accessoryID')
        .get(function(req, res) {
            var accessoryID = req.params.accessoryID;
            confMgr.accessory(accessoryID, function(success, data) {
                if (success) {
                    res.status(200).json(data);
                } else {
                    res.status(404).end();
                }
            });
        })

        .put(function(req, res) {
            var accessoryID = req.params.accessoryID;
            confMgr.removeAccessory(accessoryID, function(success, msg) {
                if (!success) {
                    res.status(404).json({"error": msg});
                    return;
                }

                var newAccessoryConfig = preparePlatformConfig(res, req.body);
                confMgr.addAccessory(newAccessoryConfig, function(success, msg) {
                    if (!success) {
                        res.status(400).json({"error": msg.error});
                        return;
                    }
                    res.status(201).json({"accessoryID": msg.accessoryID});
                    return;
                });
            });
        })

        .delete(function(req, res) {
            var accessoryID = req.params.accessoryID;
            confMgr.removeAccessory(accessoryID, function(success, msg) {
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
