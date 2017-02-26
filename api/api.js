/* eslint-env node */

'use strict';

module.exports = {
  API: API
}

/**
 * [API description]
 * @param {[type]} homebridge [description]
 */
function API(homebridge) {
    this.HomebridgeAPI = homebridge;
}


API.prototype.restartHomebridge = function(hbsConfig, callback) {
    if (!hbsConfig.hasOwnProperty("restart")) {
        callback(JSON.stringify({'success': false, 'msg': 'No restart entry in config found!'}));
        return;
    }

    var cmd = hbsConfig.restart;
    if (cmd === "") {
        callback(JSON.stringify({'success': false, 'msg': 'No restart command specified!'}));
        return;
    }

    var exec = require('child_process').exec;
    exec(cmd, function(error, stdout, stderr) {
        if (error) {
            callback({'success': false, 'msg': stderr});
            return;
        }
        callback({'success': true, 'msg': 'Restart command executed.\nPlease wait a while and reload this page.'});
    });
}
