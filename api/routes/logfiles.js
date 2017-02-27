/* eslint-env node */

'use strict';
var express = require('express');
var router = express.Router();

var logProvider;

module.exports = function(logfilePath) {
    var path = require('path');
    var LogProviderLib = require(path.resolve(__dirname, '..', 'LogProvider.js'));
    logProvider = new LogProviderLib.LogProvider(logfilePath);

    router.route('/')
        .get(function(req, res) {
            var logs = logProvider.logFiles();
            res.status(200).json(logs);
        })

    router.route('/:logID')
        .get(function(req, res) {
            var logID = req.params.logID;
            var log = logProvider.logFile(logID);
            if (log) {
                res.status(200).json({"logfilePath": log});
            } else {
                res.status(404).end();
            }
        })

        router.route('/:logID/paging/:page')
            // page of one logfile
            .get(function(req, res) {
                var logID = req.params.logID ;
                var log = logProvider.logFile(logID);
                if (!log) {
                    res.status(404).end();
                    return;
                }
                var page = req.params.page * 1;   // make sure, this is not a string...
                logProvider.logFileContent(logID, page, function (success, data) {
                    res.setHeader("Content-Type", "application/json");
                    if (success) {
                        if (data.lines.length === 0) {
                            res.status(404).end();
                            return
                        }
                        res.status(200).json(data);
                    } else {
                        res.status(400).json({"error": data});
                    }
                });
            })


        router.route('/:logID/tail/subscriptions')
            .post(function(req, res) {
                var logID = req.params.logID;
                logProvider.subscribe(logID, function (success, data) {
                    res.setHeader("Content-Type", "application/json");
                    if (success) {
                        res.status(201).json({"subscriptionID": data});
                    } else {
                        res.status(400).json({"error": data});
                    }
                });
            })

        router.route('/:logID/tail/subscriptions/:subscriptionID')
            .delete(function(req, res) {
                var logID = req.params.logID;
                var subscriptionID = req.params.subscriptionID;
                logProvider.unsubscribe(logID, subscriptionID, function (success, data) {
                    if (success) {
                        res.status(204).end();
                    } else {
                        res.status(400).json({"error": data});
                    }
                });
            })

        router.route('/:logID/tail/:subscriptionID')
            .get(function(req, res) {
                var logID = req.params.logID;
                var subscriptionID = req.params.subscriptionID;

                if (req.headers.accept !== "text/event-stream") {
                    res.status(406).end("You must call this with \'Accept: text/event-stream\'");
                    return;
                }

                res.setHeader("Content-Type", "text/event-stream");
                logProvider.output(logID, subscriptionID, function(success, line) {
                    // Test if the socket is still living. If not, the client
                    // has called event.close() on its EventSource object and doesn't want
                    // to receive further messages; so we'll unsubscribe the subscriptionID
                    // and end the connection.
                    if (req.socket.destroyed === true) {
                        logProvider.unsubscribe(logID, subscriptionID);
                        res.end();
                        return;
                    }

                    // Send the message to the client.
                    if (success) {
                        res.statusCode = 200;
                        res.write("data: " + JSON.stringify({'success': true, 'data': line}) + "\n\n");
                    } else {
                        res.statusCode = 400;
                        res.write("data: " + JSON.stringify({'success': false, 'data': line}) + "\n\n");
                        res.end();
                    }
                })
            })

    return router;
}
