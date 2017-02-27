/* eslint-env node, mocha */

var should = require('chai').should(),       // eslint-disable-line
    EventSource = require('eventsource');


describe('Testing /api/bridgeInfo', function() {
    it('can be subscribed to and returns bridgeInfo', function(done) {
        var es = new EventSource("http://127.0.0.1:8765/api/bridgeInfo");
        es.onmessage = function (m) {
            var result = JSON.parse(m.data);
            result.should.have.property('type', 'bridgeInfo');
            result.should.have.property('data').that.is.an('object');
            result.data.should.have.property('uptime');
            result.data.should.have.property('heap');
            result.data.should.have.property('osInfo');
            result.data.should.have.property('hbVersion');
            es.close();
            done();
        };
    });
});
