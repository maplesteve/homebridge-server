/* eslint-env node, mocha */

var should = require('chai').should(),       // eslint-disable-line
    superagent = require('superagent'),
    supertest = require('supertest'),
    api = supertest('http://localhost:8765');


describe('Testing the \'bridgeConfig\' API (/api/bridgeConfig)', function() {

    describe('Getting the bridgeConfig (GET /api/bridgeConfig)', function() {
        it('returns a JSON with bridge config', function(done) {
            api.get('/api/bridgeConfig')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.a('object');
                res.body.should.have.property('bridgePin');
                res.body.should.have.property('bridgeName');
                res.body.should.have.property('bridgeUsername');
                done();
            });
        });
    });

    describe('Changing the bridgeConfig (PUT /api/bridgeConfig)', function() {
        var fixtureConf = {
            "bridgeName": "orig name",
            "bridgeUsername": "AA:BB:77:88:22:11",
            "bridgePin": "000-11-222"
        };
        var changesConf = {
            "bridgeName": "changed name",
            "bridgeUsername": "CC:22:3D:E3:CE:30",
            "bridgePin": "123-45-678"
        };

        beforeEach(function() {
            superagent.put('http://127.0.0.1:8765/api/bridgeConfig')
            .type('form')
            .send(fixtureConf)
            .end();
        });

        it('Succeeds if nothing has changed', function(done) {
            api.put('/api/bridgeConfig')
            .expect(204)
            .end(function(saveErr, saveRes) {
                if (saveErr) { return done(saveErr); }
                saveRes.body.should.be.empty;
                api.get('/api/bridgeConfig')
                .end(function(checkErr, checkRes) {
                    checkRes.body.should.be.eql(fixtureConf);
                    done();
                });
            });
        });

        it('Succeeds with change of bridgeName', function(done) {
            api.put('/api/bridgeConfig')
            .send("bridgeName=" + changesConf.bridgeName)
            .expect(204)
            .end(function(saveErr, saveRes) {
                if (saveErr) { return done(saveErr); }
                saveRes.body.should.be.empty;
                api.get('/api/bridgeConfig')
                .end(function(checkErr, checkRes) {
                    checkRes.body.bridgePin.should.be.eql(fixtureConf.bridgePin);
                    checkRes.body.bridgeUsername.should.be.eql(fixtureConf.bridgeUsername);
                    checkRes.body.bridgeName.should.be.eql(changesConf.bridgeName);
                    done();
                });
            })
        })

        it('Doesn\'t overwrite username with empty string', function(done) {
            api.put('/api/bridgeConfig')
            .send("bridgeUsername=" + "")
            .expect(204)
            .end(function(saveErr, saveRes) {
                if (saveErr) { return done(saveErr); }
                saveRes.body.should.be.empty;
                api.get('/api/bridgeConfig')
                .end(function(checkErr, checkRes) {
                    checkRes.body.should.be.eql(fixtureConf);
                    done();
                });
            })
        })

        it('Succeeds with valid pin', function(done) {
            api.put('/api/bridgeConfig')
            .send("bridgePin=" + changesConf.bridgePin)
            .expect(204)
            .end(function(saveErr, saveRes) {
                if (saveErr) { return done(saveErr); }
                saveRes.body.should.be.empty;
                api.get('/api/bridgeConfig')
                .end(function(checkErr, checkRes) {
                    checkRes.body.bridgePin.should.be.eql(changesConf.bridgePin);
                    checkRes.body.bridgeUsername.should.be.eql(fixtureConf.bridgeUsername);
                    checkRes.body.bridgeName.should.be.eql(fixtureConf.bridgeName);
                    done();
                });
            })
        })

        it('Fails with invalid pin', function(done) {
            api.put('/api/bridgeConfig')
            .send("bridgePin=" + "invalid")
            .expect(400)
            .expect('Content-Type', 'application/json')
            .end(function(saveErr, saveRes) {
                if (saveErr) { return done(saveErr); }
                saveRes.body.should.have.property('error').with.length.above(5);
                api.get('/api/bridgeConfig')
                .end(function(checkErr, checkRes) {
                    checkRes.body.should.be.eql(fixtureConf);
                    done();
                });
            })
        })

        it('Succeeds with valid username', function(done) {
            api.put('/api/bridgeConfig')
            .send("bridgeUsername=" + changesConf.bridgeUsername)
            .expect(204)
            .end(function(saveErr, saveRes) {
                if (saveErr) { return done(saveErr); }
                saveRes.body.should.be.empty;
                api.get('/api/bridgeConfig')
                .end(function(checkErr, checkRes) {
                    checkRes.body.bridgePin.should.be.eql(fixtureConf.bridgePin);
                    checkRes.body.bridgeUsername.should.be.eql(changesConf.bridgeUsername);
                    checkRes.body.bridgeName.should.be.eql(fixtureConf.bridgeName);
                    done();
                });
            })
        })

        it('Fails with invalid username', function(done) {
            api.put('/api/bridgeConfig')
            .send("bridgeUsername=" + "invalid")
            .expect(400)
            .expect('Content-Type', 'application/json')
            .end(function(saveErr, saveRes) {
                if (saveErr) { return done(saveErr); }
                saveRes.body.should.have.property('error').with.length.above(5);
                api.get('/api/bridgeConfig')
                .end(function(checkErr, checkRes) {
                    checkRes.body.should.be.eql(fixtureConf);
                    done();
                });
            })
        })
    });

    describe('POST /api/bridgeConfig/createBackup', function() {
        it('Creates config.json.bak in config dir', function(done) {
            api.post('/api/bridgeConfig/createBackup')
            .expect('Content-Type', 'application/json')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                var fs = require('fs');
                res.body.path.should.have.length.above(15);
                res.body.path.should.match(/\.bak$/);
                fs.existsSync(res.body.path).should.be.true;
                var stats = fs.statSync(res.body.path);
                stats.isFile().should.be.true;
                stats.size.should.be.at.least(500);
                done();
            });
        });
    });

    describe('Not allowed methods', function() {
        it('Adding a bridgeConfig fails (POST /api/bridgeConfig)', function(done) {
            api.post('/api/bridgeConfig')
            .expect(404, done);
        });

        it('Deleting the bridgeConfig fails (DELETE /api/bridgeConfig)', function(done) {
            api.delete('/api/bridgeConfig')
            .expect(404, done);
        });
    })
});
