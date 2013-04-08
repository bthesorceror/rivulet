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

Rivulet.prototype.renderStatic = function(res) {
  res.writeHead(200, { 'Content-Type': 'application/javascript' });
  fs.createReadStream(this.polyfill).pipe(res);
}

Rivulet.prototype.setupConnection = function(req, res, path) {
  var listener = helpers.generateListener(res);

  req.socket.setTimeout(Infinity);
  res.writeHead(200, event_stream_header);

  this.emitter.on(path, listener);

  req.connection.on('close', function() {
    this.emitter.removeListener(path, listener);
  });
}

Rivulet.prototype.middleware = function() {
  var self = this;

  return function(req, res, next) {
    var match = req.url.match(self.regex);
    if (req.url == self.static_path) {
      self.renderStatic(res);
    } else if (match) {
      self.setupConnection(req, res, match[1]);
    } else {
      next();
    }
  }
}

Rivulet.prototype.send = function(path, data, event_type) {
  this.emitter.emit(path, data, event_type);
}

module.exports = Rivulet;
