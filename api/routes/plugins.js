/* eslint-env node */

'use strict';
var express = require('express');
var router = express.Router();

var pluginMgr;

function sendError(res, msg) {
    res.statusCode = 400;
    res.write(JSON.stringify({"error": msg}));
    res.end();
}

module.exports = function() {
    var path = require('path');
    var PluginManagerLib = require(path.resolve(__dirname, '..', 'PluginManager.js'));
    pluginMgr = new PluginManagerLib.PluginManager();

    router.route('/')
        .get(function(req, res) {
            res.status(200).json(pluginMgr.plugins());
        })

        .post(function(req, res) {
            var pluginName = req.body.pluginName;

            res.setHeader("Content-Type", "text/octet-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.write("Installing...");
            pluginMgr.installPlugin(pluginName, function(success, msg, closed) {
                if (!success) {
                    sendError(res, msg);
                    return;
                }
                res.statusCode = 200;

                if (closed) {
                    res.end();
                    return;
                } else {
                    res.write(msg);
                }
                res.flushHeaders();
            })
        })

        .delete(function(req, res) {
            var pluginName = req.body.pluginName;

            res.setHeader("Content-Type", "text/octet-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.write("Removing...");
            pluginMgr.removePlugin(pluginName, function(success, msg, closed) {
                if (!success) {
                    sendError(res, msg);
                    return;
                }
                res.statusCode = 200;

                if (closed) {
                    res.end();
                    return;
                } else {
                    res.write(msg);
                }
                res.flushHeaders();
            })
        })

        .put(function(req, res) {
            var pluginName = req.body.pluginName;

            res.setHeader("Content-Type", "text/octet-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.write("Updating...");
            pluginMgr.updatePlugin(pluginName, function(success, msg, closed) {
                if (!success) {
                    sendError(res, msg);
                    return;
                }
                res.statusCode = 200;

                if (closed) {
                    res.end();
                    return;
                } else {
                    res.write(msg);
                }
                res.flushHeaders();
            })
        })

    router.route('/common/searchNPM')
        .get(function(req, res) {
            pluginMgr.search(req.query.q, function(results) {
                res.status(200).json(results);
            });
        })

    return router;
}
