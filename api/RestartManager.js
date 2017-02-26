/* eslint-env node */

'use strict';

module.exports = {
  RestartManager: RestartManager
}

var homebridgeAPI;
var config;
var flagPath = "";
var pingEmitter;

function RestartManager(hbAPI, conf) {
    config = conf;
    homebridgeAPI = hbAPI;

    var pathLib = require('path');
    var configDir = homebridgeAPI.user.configPath().replace("config.json", "");
    flagPath = pathLib.resolve(configDir, 'hbs_restart_flag');

    pingEmitter = PingEmitter();

    if (this.hasFlag()) {
        pingEmitter.startPing(true);
        this.removeFlag(function() {});
    } else {
        pingEmitter.stopPing();
    }
}

RestartManager.prototype.restart = function(callback) {
    if (!config.hasOwnProperty("restart")) {
        callback({'success': false, 'msg': 'No restart entry in config found!'});
        return;
    }

    var cmd = config.restart;
    if (cmd === "") {
        callback({'success': false, 'msg': 'No restart command specified!'});
        return;
    }

    this.createFlag(function(success, msg) {
        if (!success) {
            callback(false, msg);
            return;
        }

        pingEmitter.startPing(false);
        callback(true, "ok");
    })

    var exec = require('child_process').exec;
    exec(cmd, function(error, stdout, stderr) {
        if (error) {
            callback({'success': false, 'msg': stderr});
            return;
        }
        callback({'success': true, 'msg': 'Restart command executed.\nPlease wait a while and reload this page.'});
    });
}

RestartManager.prototype.createFlag = function(callback) {
    var fs = require('fs');
    fs.writeFile(flagPath, "", function(err) {
        if (err) {
            callback(false, "Could not create flag file: " + err);
            return;
        }
        callback(true, "");
    });
}

RestartManager.prototype.removeFlag = function(callback) {
    var fs = require('fs');
    if (!fs.existsSync(flagPath)) {
        callback({success: true, msg: "Flag file does not exist."});
        return;
    }

    fs.access(flagPath, fs.R_OK | fs.W_OK, function(err) {
        if (err) {
            callback(false, "No rights to remove flag file.");
            return;
        }
        fs.unlinkSync(flagPath);
        callback(true, "");
    });
}

RestartManager.prototype.hasFlag = function() {
    var fs = require('fs');
    return fs.existsSync(flagPath);
}

RestartManager.prototype.pingEmitter = function() {
    return pingEmitter;
}


// ----
// PingEmitter
// ----
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var pingCounter = 0;

function PingEmitter() {
    if (! (this instanceof PingEmitter)) return new PingEmitter();
    this._started = false;
    EventEmitter.call(this);
}
inherits(PingEmitter, EventEmitter);

PingEmitter.prototype.startPing = function startPing(state) {
    var self = this;
    if (self._started) return;

    this._started = true;
    pingCounter = 0;
    emitPing(self, state);
};

PingEmitter.prototype.stopPing = function stopPing() {
    clearInterval(this._interval);
    this._started = false;
};

function emitPing(emitter, state) {
    pingCounter++;
    if ((pingCounter > 20) && state) {
        emitter.stopPing();
        return;
    }

    emitter.emit('restarted', state);
    setTimeout(function() {
        emitPing(emitter, state);
    }, 1000);
}
