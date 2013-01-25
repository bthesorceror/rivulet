var EventEmitter = require('events').EventEmitter,
    fs           = require('fs'),
    path         = require('path'),
    hash         = require('hashish'),
    helpers      = require('./lib/helpers');

var event_stream_header = {
  'Content-Type':  'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection':    'keep-alive'
}

var default_options = {
  path: 'rivulets',
  polyfill: path.join(__dirname, '/static/event-source.js'),
}

function Rivulet(options) {
  options = hash.merge(default_options, options || {});
  this.path        = options['path'];
  this.emitter     = new EventEmitter();
  this.regex       = new RegExp('/' + this.path + '/(.*)');
  this.static_path = '/' + this.path + '/event-source.js';
  this.polyfill    = options['polyfill'];
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
          listener = helpers.generateListener(res);

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
