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
            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify(resultJSON));
            res.end();
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
                res.statusCode = 204;
                res.end();
                return;
            }

            confMgr.updateBridgeConfig(changes, function(success, msg) {
                if (success) {
                    res.statusCode = 204;
                } else {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.write(JSON.stringify({'error': msg}));
                }
                res.end();
            });
            //
            // serverAPI.saveBridgeConfig(bodyJSON, function (success, msg) {
            //     if (success) {
            //         res.statusCode = 204;
            //     } else {
            //         res.statusCode = 400;
            //         res.setHeader("Content-Type", "application/json");
            //         res.write(JSON.stringify({'error': msg}));
            //     }
            //     res.end();
            // });
        })

    router.route('/createBackup')
        .post(function(req, res) {
            confMgr.backupConfigFile(function (success, msg) {
                res.setHeader("Content-Type", "application/json");
                if (success) {
                    res.statusCode = 200;
                    res.write(JSON.stringify({'path': msg}));
                } else {
                    res.statusCode = 400;
                    res.write(JSON.stringify({'error': msg}));
                }
                res.end();
            });
        })

    return router;
}
