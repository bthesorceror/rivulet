var Rivulet        = require('../rivulet'),
    assert         = require('assert'),
    sinon          = require('sinon'),
    mockery        = require('mockery'),
    EventEmitter   = require('events').EventEmitter;

function createServerRequest(url) {
  return {
    res: {
      write: sinon.spy(),
      writeHead: sinon.spy()
    },
    req: {
      url: url,
      socket: {
        setTimeout: sinon.spy()
      },
      connection: new EventEmitter()
    },
    next: sinon.spy()
  }
}

describe('Rivulet', function() {

  describe('normal operation', function() {
    var streamMock = {
      pipe: sinon.spy()
    }

    var fsMock = {
      createReadStream: sinon.stub().returns(streamMock)
    }

    mockery.enable({ useCleanCache: true, warnOnUnregistered: false });
    mockery.registerMock('fs', fsMock);

    var Rivulet    = require('../rivulet'),
        filePath   = 'here I am',
        setup      = {
          hub: null,
          path: 'rivulets',
          polyfill: filePath
        },
        rivulet    = new Rivulet(setup),
        middleware = rivulet.middleware();

    mockery.deregisterAll();
    mockery.disable();

    describe('with a polyfill path', function() {

      it('should return the polyfile js file', function() {
        response = createServerRequest('/rivulets/event-source.js');
        middleware(response.req, response.res, response.next);
        assert.ok(response.res.writeHead.calledWith(200, { 'Content-Type': 'application/javascript' }));
        assert.ok(fsMock.createReadStream.calledWith(filePath));
        assert.ok(streamMock.pipe.calledWith(response.res));
      });

    });

    describe('with a unknown path', function() {

      it('should move on to the next middleware', function() {
        var path = 'test',
            data = 'HELLO',
            request = createServerRequest('/frogs/test');

        middleware(request.req, request.res, request.next);
        assert.ok(request.next.called);
      });

    });

    describe('with a rivulet path', function() {
      var path = 'test',
          data = 'HELLO',
          event = 'tricky';

      it('should pass along the data', function() {
        var request = createServerRequest('/rivulets/test');

        middleware(request.req, request.res, request.next);
        rivulet.send(path, data);

        assert.ok(request.req.socket.setTimeout.calledWith(Infinity));
        assert.ok(request.res.write.calledWith("data: \"" + data + "\"\n\n"));
      });

      it('should pass along the event', function() {
        var request = createServerRequest('/rivulets/test');

        middleware(request.req, request.res, request.next);
        rivulet.send(path, data, event);

        assert.ok(request.req.socket.setTimeout.calledWith(Infinity));
        assert.ok(request.res.write.calledWith("event: " + event + "\n"));
        assert.ok(request.res.write.calledWith("data: \"" + data + "\"\n\n"));
      });

    });

  });
});
