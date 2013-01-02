var EventEmitter = require('events').EventEmitter;

function Rivulet(path) {
  this.path = path || 'rivulets';
  this.emitter = new EventEmitter();
  this.regex = new RegExp('/' + this.path + '/(.*)');
}

Rivulet.prototype.middleware = function() {
  var self = this;
  return function(req, res, next) {
    if (match = req.url.match(self.regex)) {
      var path = match[1];
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      self.emitter.on(path, function(data) {
        var json = JSON.stringify(data);
        res.write("data: " + json + "\n\n");
      });
    } else {
      next();
    }
  }
}

Rivulet.prototype.send = function(path, data) {
  this.emitter.emit(path, data);
}

module.exports = Rivulet;
