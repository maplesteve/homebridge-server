/* eslint-env node */

'use strict';
var express = require('express');
var router = express.Router();

module.exports = function(HomebridgeAPI, infoOptions) {
    var pathLib = require('path');
    var BridgeInfoEmitter = require(pathLib.resolve(__dirname, '..', '..', 'lib', 'HomebridgeInfoEmitter', 'BridgeInfoEmitter.js'));
    var infoEmitter = BridgeInfoEmitter(infoOptions, HomebridgeAPI);
    infoEmitter.start();

    router.route('/')
        .get(function(req, res) {
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
        })

    return router;
}
