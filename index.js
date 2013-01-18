var EventEmitter = require('events').EventEmitter,
    fs = require('fs');

var event_stream_header = {
                            'Content-Type':  'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'Connection':    'keep-alive'
                          }

var default_polyfill = __dirname + '/static/event-source.js';

function superProxyMe(func, context) {
  return function() {
    func.apply(context, arguments);
  }
}

function generateListener(res) {
  return function(data, event_type) {
    var json = JSON.stringify(data);
    if (event_type) {
      res.write("event: " + event_type + "\n");
    }
    res.write("data: " + json + "\n\n");
  };
}

function Rivulet(hub, path, options) {
  options = options || {};
  this.path        = path || 'rivulets';
  this.emitter     = new EventEmitter();
  this.regex       = new RegExp('/' + this.path + '/(.*)');
  this.static_path = '/' + this.path + '/event-source.js';
  this.polyfill    = options['polyfill'] || default_polyfill;
  hub && hub.on(this.path, superProxyMe(this.send, this));
}

Rivulet.prototype.middleware = function() {
  var self = this;
  return function(req, res, next) {
    var match = req.url.match(self.regex);
    if (req.url == self.static_path) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      fs.createReadStream(self.polyfill).pipe(res);
    } else if (match) {
      var path     = match[1],
          listener = generateListener(res);

      req.socket.setTimeout(Infinity);
      res.writeHead(200, event_stream_header);

      self.emitter.on(path, listener);

      req.connection.on('close', function() {
        self.emitter.removeListener(path, listener);
      });
    } else {
      next();
    }
  }
}

Rivulet.prototype.send = function(path, data, event_type) {
  this.emitter.emit(path, data, event_type);
}

module.exports = Rivulet;
