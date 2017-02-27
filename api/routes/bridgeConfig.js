/* eslint-env node */

'use strict';
var express = require('express');
var router = express.Router();

var confMgr;

module.exports = function(hbAPI, configManager) {
    confMgr = configManager;

    router.route('/')
        .get(function(req, res) {
            var bridgeConfig = confMgr.config().bridge;
            var resultJSON = {
                bridgePin: bridgeConfig.pin,
                bridgeName: bridgeConfig.name,
                bridgeUsername: bridgeConfig.username,
            }
            res.status(200).json(resultJSON);
        })

        .put(function(req, res) {
            var configChanges = req.body;
            var changes = [];
            var hasChanges = false;
            if (configChanges.bridgeName) {
                changes["name"] = configChanges.bridgeName;
                hasChanges = true;
            }

            if (configChanges.bridgeUsername) {
                changes["username"] = configChanges.bridgeUsername;
                hasChanges = true;
            }

            if (configChanges.bridgePin) {
                changes["pin"] = configChanges.bridgePin;
                hasChanges = true;
            }

            if (!hasChanges) {
                res.status(204).end();
                return;
            }

            confMgr.updateBridgeConfig(changes, function(success, msg) {
                if (success) {
                    res.status(204).end();
                } else {
                    res.status(400).json({"error": msg});
                }
            });
        })

    router.route('/createBackup')
        .post(function(req, res) {
            confMgr.backupConfigFile(function (success, msg) {
                res.setHeader("Content-Type", "application/json");
                if (success) {
                    res.status(200).json({"path": msg});
                } else {
                    res.status(400).json({"error": msg});
                }
            });
        })

    return router;
}
