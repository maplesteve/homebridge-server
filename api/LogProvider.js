/* eslint-env node, es6 */

'use strict';

module.exports = {
  LogProvider: LogProvider
}

// The processes; read the individual logfile and emits data
var tailProcesses = [];

// The active subscriptionIDs are stored in this set
var subscriptions = new Set();

// The paths to the logfiles
var logfiles = [];

function LogProvider(logPathOrArray) {
    if (Array.isArray(logPathOrArray)) {
        logfiles = logPathOrArray;
    } else {
        logfiles.push(logPathOrArray);
    }
}

LogProvider.prototype.logFiles = function() {
    return logfiles;
}

LogProvider.prototype.logFile = function(logFileID) {
    return logfiles[logFileID];
}


//
// Paging
//
LogProvider.prototype.logFileContent = function(logFileID, page, callback) {
    var logFilePath = this.logFile(logFileID);
    var linesPerPage = 100;

    var fs = require('fs');
    fs.access(logFilePath, fs.R_OK , function(err) {
        if (err) {
            callback(false, "Problem reading file: " + logFilePath + " " + err);
            return;
        }

        var lineReader = require('line-reader');
        var lines = [];
        var currentLineNumber = 0;
        lineReader.eachLine(logFilePath, function(line, last) {
            currentLineNumber++;
            if ((currentLineNumber >= ((page -1)  * linesPerPage)) &&
                (currentLineNumber < (page * linesPerPage))) {
                lines.push(line);
            }
            if (last) {
                var result = {
                    "currentPage": page,
                    "totalLines": currentLineNumber,
                    "lastPage": Math.ceil(currentLineNumber / linesPerPage),
                    "lines": lines
                };
                callback(true, result);
                return false; // stop reading
            }
        });
    });
}


//
// Tailing
//
LogProvider.prototype.createTailProcess = function(logFileID, callback) {
    var logFilePath = this.logFile(logFileID);
    if (!logFilePath) {
        callback(false, "Invalid logfile.");
        return;
    }

    // If the process already exists, ensure that it's active and return.
    if (tailProcesses[logFilePath]) {
        tailProcesses[logFilePath].watch();
        callback(true, "Existing.");
        return;
    }

    // It's not yet existing, so create it...
    var fs = require('fs');
    fs.access(logFilePath, fs.R_OK , function(err) {
        if (err) {
            callback(false, "Problem reading file: " + logFilePath + " " + err);
            return;
        }

        // Setup the tail process, but don't start it.
        try {
            var Tail = require('tail').Tail;
            var tailProcess = new Tail(logFilePath);
            tailProcess.unwatch();
            tailProcesses[logFilePath] = tailProcess;
            callback(true, "Created.");
        } catch (e) {
            callback(false, "Could not create tail process.");
            return;
        }
    });
}

// Generates a new subscriptionID, adds it to 'subscriptions' and returns it.
LogProvider.prototype.subscribe = function(logFileID, callback) {
    this.createTailProcess(logFileID, function(success, msg) {
        if (!success) {
            callback(false, msg);
            return;
        }

        var uuid = require('uuid');
        var newID = uuid.v4();
        subscriptions.add(newID);
        callback(true, newID);
    })
}

// Removes a given subscriptionID from 'subscriptions'.
// If there are no more subscriptions, the tail is stopped and emits no further data.
LogProvider.prototype.unsubscribe = function(logFileID, subscriptionID, callback) {
    if (!callback) {
        callback = function() {}
    }

    if (!subscriptions.has(subscriptionID)) {
        callback(false, "not_subscribed");
        return;
    }
    subscriptions.delete(subscriptionID);
    if (subscriptions.size === 0) {
        var tailProcess = tailProcesses[this.logFile(logFileID)];
        tailProcess.unwatch();
    }
    callback(true, "");
}


// Called by clients with a subscriptionID and a callback. The callback is called,
// if the given subscriptionID is still subscribed.
LogProvider.prototype.output = function(logFileID, subscriptionID, callback) {
    var logFilePath = this.logFile(logFileID);
    var tailProcess = tailProcesses[logFilePath];

    // check tailProcess
    if (!tailProcess) {
        callback(false, "No tailProcess.");
        return;
    }

    // check subscriptionID
    if (!subscriptions.has(subscriptionID)) {
        callback(false, "not_subscribed");
        return;
    }

    // Output something initially
    callback(true, "tailing...");

    tailProcess.on("line", function(data) {
        if (subscriptions.has(subscriptionID)) {
            callback(true, data);
        }
    });

    tailProcess.on("error", function(error) {
      callback(false, error)
    });
}
