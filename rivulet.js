var EventEmitter = require('events').EventEmitter,
    fs           = require('fs'),
    path         = require('path'),
    hash         = require('hashish');

var event_stream_header = {
  'Content-Type':  'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection':    'keep-alive',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
  'Access-Control-Allow-Headers': 'Content-Type'
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
  this.emitter.setMaxListeners(0);
}

(require('util')).inherits(Rivulet, EventEmitter);

Rivulet.prototype.renderStatic = function(res) {
  res.writeHead(200, { 'Content-Type': 'application/javascript' });
  fs.createReadStream(this.polyfill).pipe(res);
}

Rivulet.prototype.generateListener = function(res) {
  return function(data, event_type) {
    if (event_type)
      res.write("event: " + event_type + "\n");
    res.write("data: " + data + "\n\n");
  };
}

Rivulet.prototype.setupConnection = function(req, res, path) {
  req.socket.setTimeout(0);
  res.writeHead(200, event_stream_header);
  res.write('\n');

  this.emit('connection', path, req, res);

  var listener = this.generateListener(res);

  this.emitter.on(path, listener);

  req.connection.on('close', function() {
    this.emitter.removeListener(path, listener);
    this.emit('disconnect', path, req, res);
  }.bind(this));
}

Rivulet.prototype.middleware = function() {

  return function(req, res, next) {
    var match = req.url.match(this.regex);
    if (req.url == this.static_path) {
      this.renderStatic(res);
    } else if (match) {
      this.setupConnection(req, res, match[1]);
    } else {
      next();
    }
  }.bind(this);
}

Rivulet.prototype.send = function(path, data, event_type) {
  this.emitter.emit(path, JSON.stringify(data), event_type);
}

module.exports = Rivulet;
