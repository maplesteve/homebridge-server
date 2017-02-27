/* eslint-env node, mocha */

var should = require('chai').should(),       // eslint-disable-line
    superagent = require('superagent'),
    supertest = require('supertest'),
    api = supertest('http://localhost:8765');


describe('Testing the \'platforms\' API (/api/platforms)', function() {
    var save;

    describe('GET /api/platforms', function() {

        it('GET /api/platforms returns a JSON with a list of installed platforms', function(done) {
            api.get('/api/platforms')
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property('_config');
                res.body[0]._config.should.have.property('platform');
                res.body[0].should.have.property('_meta');
                res.body[0]._meta.should.have.property('pluginName');
                res.body[0]._meta.should.have.property('isActive');
                save = res.body[0]._meta.id;
                done();
            });
        });
    });

    describe('GET /api/platforms/{id}', function() {
        it('returns a JSON with the platform identified by a valid id', function(done) {
            api.get('/api/platforms/' + save)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.a('object');
                res.body.should.have.property('_config');
                res.body._config.should.have.property('platform');
                res.body.should.have.property('_meta');
                res.body._meta.should.have.property('pluginName');
                res.body._meta.should.have.property('isActive');
                res.body._meta.should.have.property('id').and.be.eql(save);
                done();
            });
        });

        it('fails with an invalid id', function(done) {
            api.get('/api/platforms/invalid')
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.empty;
                done();
            });
        });
    });

    describe('DELETE /api/platforms/{id}', function() {
        it.skip('Succeeds with a valid ID', function(done) {
            done();
        });

        it('fails when the id is invalid', function(done) {
            api.delete('/api/platforms/invalid')
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.not.be.a('array');
                res.body.error.should.be.not.empty;
                res.body.should.have.property('error').with.length.above(10);
                res.body.should.not.have.property('msg');
                done();
            });
        });
    });

    describe('Adding and removing a platform works', function() {
        var newConfig = {
            "platformConfig": {
                "name": "newName",
                "key1": "value1",
                "key2": true
            },
            "plugin": "homebridge-test"
        }

        // make a copy
        var expectation = {};
        expectation._meta = {};
        expectation._config = JSON.parse(JSON.stringify(newConfig.platformConfig));
        expectation._config.platform = newConfig.plugin;
        expectation._meta.isActive = false;
        expectation._meta.pluginID = '';
        expectation._meta.pluginName = newConfig.plugin;
        // expectation._meta.id = '4787b4a76c873aa84504d19833fae22703c88ba505a0061c40a428c72ae089de';

        var idOfCreatedPlatform = "";

        it('can add a platform (POST /api/platforms)', function(done) {
            api.post('/api/platforms')
            .send({"platformConfig": newConfig.platformConfig})
            .send({"plugin": newConfig.plugin})
            // .send("platformConfig=" + JSON.stringify(newConfig.platformConfig))
            // .send("plugin=" + newConfig.plugin)
            .expect(201)
            .end(function(err, res) {
                res.body.should.have.property('platformID').with.length.above(10);
                idOfCreatedPlatform = res.body.platformID;
                done();
            });
        });
        it('can fetch the added platform (GET /api/platforms/{id})', function(done) {
            api.get('/api/platforms/' + idOfCreatedPlatform)
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.should.be.a('object');
                res.body._config.should.include(expectation._config);
                res.body._meta.should.include(expectation._meta);
                done();
            });
        })
        it('DELETE can remove the added platform (/api/platform/{id})', function(done) {
            api.delete('/api/platforms/' + idOfCreatedPlatform)
            .expect(204)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.should.be.empty;
                done();
            });
        })
        it('the removed platform is no longer listed', function(done) {
            api.get('/api/platforms')
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.should.be.a('array').and.have.length(1);
                res.body.should.not.include(expectation);
                done();
            });
        })

        // call addPlatformConfig with invalid payload
    })

    describe('PUT /api/platforms/{id}', function() {
        describe('Updating a platform works (PUT /api/platforms/{id})', function() {
            var newConfig = {
                "platformConfig": {
                    "name": "newName",
                    "key1": "value1",
                    "key2": true
                },
                "plugin": "homebridge-test"
            }

            var idOfCreatedPlatform = "";
            var idOfUpdatedPlatform = "";

            before(function(done) {
                // create a new platform
                superagent.post('http://127.0.0.1:8765/api/platforms')
                .send(newConfig)
                .end(function(err, res) {
                    idOfCreatedPlatform = res.body.platformID;
                    done();
                });
            });

            after(function(done) {
                superagent.delete('http://127.0.0.1:8765/api/platforms/' + idOfUpdatedPlatform)
                .end(done);
            })

            it('The update is saved when the payload is valid.', function(done) {
                // make a copy
                var updatedConfig = {};
                updatedConfig.platformConfig = JSON.parse(JSON.stringify(newConfig.platformConfig));
                updatedConfig.platformConfig.name = "updated name";
                updatedConfig.plugin = newConfig.plugin;

                // make a copy
                var expectation = {};
                expectation._config = JSON.parse(JSON.stringify(updatedConfig.platformConfig));
                expectation._config.platform = updatedConfig.plugin;
                expectation._meta = {
                    "isActive": false,
                    "pluginName": 'homebridge-test',
                    "pluginID": ''
                };

                api.put('/api/platforms/' + idOfCreatedPlatform)
                .send({"platformConfig": updatedConfig.platformConfig})
                .send({"plugin": updatedConfig.plugin})
                .expect(201)
                .end(function(err) {
                    if (err) { return done(err); }
                    api.get('/api/platforms')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) { return done(err); }
                        res.body.should.be.a('array').and.have.length(2);

                        var indexOfAddedPlatform = -1;

                        // neither include nor includeMembers work here, so we'll
                        // need our own comparison function
                        var comparison = false;
                        for (var cfg in res.body) {
                            if ((res.body[cfg]._meta.isActive === expectation._meta.isActive) &&
                                (res.body[cfg]._meta.pluginID === expectation._meta.pluginID) &&
                                (res.body[cfg]._meta.pluginName === expectation._meta.pluginName)) {
                                    var isEqual = true;
                                    for (var configKey in res.body[cfg]._config) {       // eslint-disable-line
                                        if (res.body[cfg]._config.configKey !== expectation._config.configKey) {
                                            isEqual = false;
                                        }
                                    }
                                if (isEqual) {
                                    indexOfAddedPlatform = cfg;
                                }
                                if (!comparison) {
                                    comparison = isEqual;
                                }
                            } else {
                                if (!comparison) {
                                    comparison = false;
                                }
                            }
                        }
                        comparison.should.be.true;

                        idOfUpdatedPlatform = res.body[indexOfAddedPlatform]._meta.id;
                        done();
                    });
                });
            })

            it('The update fails when the ID is not valid.', function(done) {
                api.put('/api/platform/invalid')
                .send({"platformConfig": newConfig.platformConfig})
                .send({"plugin": newConfig.plugin})
                .expect(404, done)
            })
        })

        describe('PUT /api/platforms/{id}', function() {
            it('fails, when the endpoint is accessed directly', function(done) {
                api.put('/api/platforms')
                .expect(404)
                .end(function(err) {
                    if (err) return done(err);
                    done();
                });
            });
            it('fails, when no id is given', function(done) {
                api.put('/api/platforms/')
                .expect(404)
                .end(function(err) {
                    if (err) return done(err);
                    done();
                });
            });
            it('fails, with an invalid id', function(done) {
                api.put('/api/platforms/invalid')
                .expect(404)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.not.be.a('array');
                    res.body.error.should.be.not.empty;
                    done();
                });
            });
        });
    })
});
