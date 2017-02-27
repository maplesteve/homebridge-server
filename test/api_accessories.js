/* eslint-env node, mocha */

var should = require('chai').should(),       // eslint-disable-line
    superagent = require('superagent'),
    supertest = require('supertest'),
    api = supertest('http://localhost:8765');


describe('Testing the \'accessories\' API (/api/accessories)', function() {
    var save;

    describe('GET /api/accessories', function() {

        it('GET /api/accessories returns a JSON with a list of installed accessories', function(done) {
            api.get('/api/accessories')
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.a('array');
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property('_config');
                res.body[0]._config.should.have.property('accessory');
                res.body[0].should.have.property('_meta');
                res.body[0]._meta.should.have.property('pluginName');
                res.body[0]._meta.should.have.property('isActive');
                save = res.body[0]._meta.id;
                done();
            });
        });
    });

    describe('GET /api/accessories/{id}', function() {
        it('returns a JSON with the accessory identified by a valid id', function(done) {
            api.get('/api/accessories/' + save)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.a('object');
                res.body.should.have.property('_config');
                res.body._config.should.have.property('accessory');
                res.body.should.have.property('_meta');
                res.body._meta.should.have.property('pluginName');
                res.body._meta.should.have.property('isActive');
                res.body._meta.should.have.property('id').and.be.eql(save);
                done();
            });
        });

        it('fails with an invalid id', function(done) {
            api.get('/api/accessories/invalid')
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.empty;
                done();
            });
        });
    });

    describe('DELETE /api/accessories/{id}', function() {
        it.skip('Succeeds with a valid ID', function(done) {
            done();
        });

        it('fails when the id is invalid', function(done) {
            api.delete('/api/accessories/invalid')
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


    describe('Adding and removing an accessory works', function() {
        var newConfig = {
            "accessoryConfig": {
                "name": "newName",
                "key1": "value1",
                "key2": true
            },
            "plugin": "homebridge-test"
        }
        // make a copy
        var expectation = {};
        expectation._meta = {};
        expectation._config = JSON.parse(JSON.stringify(newConfig.accessoryConfig));
        expectation._config.accessory = newConfig.plugin;
        expectation._meta.isActive = false;
        expectation._meta.pluginID = '';
        expectation._meta.pluginName = newConfig.plugin;

        var idOfCreatedAccessory = "";

        it('can add a platform (POST /api/accessories)', function(done) {
            api.post('/api/accessories')
            .send({"accessoryConfig": newConfig.accessoryConfig})
            .send({"plugin": newConfig.plugin})
            .expect(201)
            .end(function(err, res) {
                res.body.should.have.property('accessoryID').with.length.above(10);
                idOfCreatedAccessory = res.body.accessoryID;
                done();
            });
        });
        it('can fetch the added platform (GET /api/accessories/{id})', function(done) {
            api.get('/api/accessories/' + idOfCreatedAccessory)
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.should.be.a('object');
                // res.body.should.include(expectation);
                res.body._config.should.include(expectation._config);
                res.body._meta.should.include(expectation._meta);
                done();
            });
        })
        it('DELETE can remove the added accessory (/api/accessories/{id})', function(done) {
            api.delete('/api/accessories/' + idOfCreatedAccessory)
            .expect(204)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.should.be.empty;
                done();
            });
        })
        it('the removed accessory is no longer listed', function(done) {
            api.get('/api/accessories')
            .expect(200)
            .end(function(err, res) {
                if (err) { return done(err); }
                res.body.should.be.a('array').and.have.length(1);
                res.body.should.not.include(expectation);
                done();
            });
        })
    })

    describe('PUT /api/accessories/{id}', function() {
        describe('Updating an accessory works (PUT /api/accessories/{id})', function() {
            var newConfig = {
                "accessoryConfig": {
                    "name": "newName",
                    "key1": "value1",
                    "key2": true
                },
                "plugin": "homebridge-test"
            }
            // make a copy
            var expectation = JSON.parse(JSON.stringify(newConfig.accessoryConfig));
            expectation.accessory = newConfig.plugin;

            var idOfCreatedAccessory = "";
            var idOfUpdatedAccessory = "";

            before(function(done) {
                // create a new platform
                superagent.post('http://127.0.0.1:8765/api/accessories')
                .send(newConfig)
                .end(function(err, res) {
                    idOfCreatedAccessory = res.body.accessoryID;
                    done();
                });
            });

            after(function(done) {
                superagent.delete('http://127.0.0.1:8765/api/accessories/' + idOfUpdatedAccessory)
                .end(done);
            })

            it('The update is saved when the payload is valid.', function(done) {
                // make a copy
                var updatedConfig = {};
                updatedConfig.accessoryConfig = JSON.parse(JSON.stringify(newConfig.accessoryConfig));
                updatedConfig.accessoryConfig.name = "updated name";
                updatedConfig.plugin = newConfig.plugin;

                var expectation = {};
                expectation._config = JSON.parse(JSON.stringify(updatedConfig.accessoryConfig));
                expectation._config.accessory = updatedConfig.plugin;
                expectation._meta = {
                    "isActive": false,
                    "pluginName": 'homebridge-test',
                    "pluginID": ''
                };

                api.put('/api/accessories/' + idOfCreatedAccessory)
                .send({"accessoryConfig": updatedConfig.accessoryConfig})
                .send({"plugin": updatedConfig.plugin})
                .expect(201)
                .end(function(err) {
                    if (err) { return done(err); }
                    api.get('/api/accessories')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) { return done(err); }
                        res.body.should.be.a('array').and.have.length(2);

                        var indexOfAddedAccessory = -1;

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
                                    indexOfAddedAccessory = cfg;
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

                        idOfUpdatedAccessory = res.body[indexOfAddedAccessory]._meta.id;
                        done();
                    });
                });
            })

            it('The update fails when the ID is not valid.', function(done) {
                api.put('/api/accessories/invalid')
                .send({"accessoryConfig": newConfig.accessoryConfig})
                .send({"plugin": newConfig.plugin})
                .expect(404, done)
            })
        })

        it('fails, when the endpoint is accessed directly', function(done) {
            api.put('/api/accessories')
            .expect(404, done)
        });
        it('fails, when no id is given', function(done) {
            api.put('/api/accessories/')
            .expect(404, done)
        });
        it('fails, with an invalid id', function(done) {
            api.put('/api/accessories/invalid')
            .expect(404, done)
        });
    });
});
