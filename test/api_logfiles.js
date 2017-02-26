/* eslint-env node, mocha */

var should = require('chai').should(),       // eslint-disable-line
    supertest = require('supertest'),
    api = supertest('http://localhost:8765');

describe('Testing the \'logfiles\' API (/api/logfiles)', function() {

    describe('Getting the logfiles (GET /api/logfiles)', function() {
        it('returns the logfile paths as JSON array', function(done) {
            api.get('/api/logfiles')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.a('array').and.have.lengthOf(3);
                done();
            });
        });

        it('returns \'homebridge.err\' for the id 2', function(done) {
            api.get('/api/logfiles/2')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.a('object');
                res.body.should.have.property('logfilePath');
                res.body.logfilePath.should.be.eql("/var/log/homebridge.err");
                done();
            });
        });

        it('fails for an invalid id', function(done) {
            api.get('/api/logfiles/99')
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.empty;
                done();
            });
        });
    });

    describe('Getting a specific page (GET /api/logfiles/{id}/paging/{page})', function() {
        it('Succeeds for a valid logFileID and valid page', function(done) {
            // This fails when the test log just rotated... Use a fixture log file in scripts folder
            api.get('/api/logfiles/1/paging/2')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.not.be.empty;
                res.body.should.have.property('currentPage').and.eql(2);
                res.body.should.have.property('totalLines');
                res.body.should.have.property('lastPage');
                res.body.should.have.property('lines').which.is.a('array');
                done();
            });
        });

        it('Fails for an invalid logFileID', function(done) {
            api.get('/api/logfiles/99/paging/2')
            .expect(404, done);
        });

        it('Fails for an invalid page', function(done) {
            api.get('/api/logfiles/1/paging/10000')
            .expect(404, done);
        });

        it('fails when logfile is not readable or existing', function(done) {
            api.get('/api/logfiles/0/paging/1')
            .expect(400)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.have.property("error").not.be.empty;
                done();
            });
        });
    });

    describe('Getting a tail of a specific logfiles (GET /api/logfiles/{id}/tail)', function() {
        var savedSubscriptionID;
        describe('Subscribing (GET /api/logfiles/{id}/tail/subscriptions)', function() {
            it('Can subscribe tail for a specific logfile', function(done) {
                api.post('/api/logfiles/1/tail/subscriptions')
                .expect(201)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.have.property("subscriptionID").and.is.a('string').which.is.not.empty;
                    savedSubscriptionID = res.body.subscriptionID;
                    done();
                });
            });

            it('Fails for an invalid logfile', function(done) {
                api.post('/api/logfiles/19/tail/subscriptions')
                .expect(400)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.have.property("error");
                    done();
                });
            });
        });

        describe('Unsubscribing (DELETE /api/logfiles/{id}/tail/subscriptions/{subscriptionID})', function() {
            it('Can unsubscribe a valid subscriptionID', function(done) {
                api.delete('/api/logfiles/1/tail/subscriptions/' + savedSubscriptionID)
                .expect(204)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.be.empty;
                    done();
                });
            });

            it('Fails for an invalid subscriptionID', function(done) {
                api.delete('/api/logfiles/1/tail/subscriptions/invalidID')
                .expect(400)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.have.property("error");
                    done();
                });
            });
        });

        describe('The tail event source is setup (GET /api/logfiles/{id}/tail/{subscriptionID})', function() {
            it('can read the events', function(done) {
                api.post('/api/logfiles/1/tail/subscriptions')
                .expect(201)
                .end(function(err, res) {
                    if (err) return done(err);
                    var save = res.body.subscriptionID;

                    var EventSource = require('eventsource');
                    var es = new EventSource("http://127.0.0.1:8765/api/logfiles/1/tail/" + save);
                    es.onmessage = function (m) {
                        var result = JSON.parse(m.data);
                        result.should.have.property('data');
                        done();
                    };
                });
            });

            it('Fails for a subscriptionID that is not subscribed', function(done) {
                api.get('/api/logfiles/1/tail/' + "invalid")
                .set("Accept", 'text/event-stream')
                .expect('Content-Type', 'text/event-stream')
                .expect(400, done);
            });

            it('Fails when accept header is not text/event-stream', function(done) {
                api.get('/api/logfiles/1/tail/' + "invalid")
                .set("Accept", 'application/json')
                .expect(406, done);
            });
        });
    });
});
