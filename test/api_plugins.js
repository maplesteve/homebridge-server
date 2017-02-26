/* eslint-env node, mocha */

var should = require('chai').should(),       // eslint-disable-line
    supertest = require('supertest'),
    api = supertest('http://localhost:8765');


describe('Testing the \'plugins\' API (/api/plugins)', function() {

    describe('GET /api/plugins', function() {
        it('GET /api/plugins returns a JSON with a list of installed plugins', function(done) {
            api.get('/api/plugins')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.a('array');
                res.body[0].should.have.property('name');
                res.body[0].should.have.property('version');
                res.body[0].should.have.property('latestVersion');
                res.body[0].should.have.property('isLatestVersion');
                res.body[0].should.have.property('platformUsage');
                res.body[0].should.have.property('accessoryUsage');

                // don't use these in tests, since race conditions may occur,
                // because the info is lazy loaded and may not be ready when the test runs.
                // res.body[0].should.have.property('description');
                // res.body[0].should.have.property('author');
                // res.body[0].should.have.property('homepage');
                // res.body[0].should.have.property('homebridgeMinVersion');
                done();
            });
        });
    });

    describe('Search for plugins on npms', function() {
        it('returns a JSON list search results for \'server\'', function(done) {
            api.get('/api/plugins/common/searchNPM?q=server')
            .expect(200)
            .expect('Content-Type', 'application/json')
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.a('array').with.length.above(2);
                res.body[0].should.have.property('package');
                res.body[0].package.should.have.property('version');
                res.body[0].package.should.have.property('description');
                res.body[0].should.have.property('hb_IsInstalled');
                done();
            });
        });
    });

    describe('Install a plugin', function() {
        this.timeout(5000);
        it('Succeeds ...', function(done) {
            api.post('/api/plugins/')
            .send("pluginName=" + "homebridge-platform-wemo")
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.text.should.not.be.empty;
                done();
            });
        });
    });

    describe('Remove a plugin', function() {
        it('Succeeds ...', function(done) {
            api.delete('/api/plugins/')
            .send("pluginName=" + "homebridge-platform-wemo")
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.text.should.not.be.empty;
                done();
            });
        });
    });

    describe('Update a plugin', function() {
        it('Succeeds ...', function(done) {
            api.put('/api/plugins/')
            .send("pluginName=" + "homebridge-platform-wemo")
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.text.should.not.be.empty;
                done();
            });
        });
    });
});
