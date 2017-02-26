/* eslint-env node */

'use strict';
var express = require('express');
var router = express.Router();

module.exports = function(hbAPI, hbsConfig) {
    var path = require('path');
    var RestartManagerLib = require(path.resolve(__dirname, '..', 'RestartManager.js'));
    var restartMgr = new RestartManagerLib.RestartManager(hbAPI, hbsConfig);

    router.route('/')
        .get(function(req, res) {
            res.setHeader("Content-Type", "text/event-stream");
            res.write("data: " + JSON.stringify({'restarted': false}) + "\n\n");

            restartMgr.pingEmitter().on('restarted', function(data) {
                res.write("data: " + JSON.stringify({'restarted': data}) + "\n\n");
            });
        })
        .post(function(req, res) {
            restartMgr.restart(function(success, msg) {
                if (!success) {
                    res.status(400).json({ error: msg });
                    return;
                }
                res.status(200).json({ msg: 'Restarted. Make sure to subscribe an event source to GET /api/restart' });
            })
        })

    return router;
}
