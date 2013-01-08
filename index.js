var EventEmitter = require('events').EventEmitter,
    fs = require('fs');

function Rivulet(path) {
  this.path = path || 'rivulets';
  this.emitter = new EventEmitter();
  this.regex = new RegExp('/' + this.path + '/(.*)');
  this.static_path = '/' + this.path + '/event-source.js';
}

Rivulet.prototype.middleware = function() {
  var self = this;
  return function(req, res, next) {
    var match = req.url.match(self.regex)
    if (req.url == self.static_path) {
      res.writeHead(200, { 'Content-Type': 'text/application' });
      var file = fs.createReadStream(__dirname + '/static/event-source.js');
      file.pipe(res);
    } else if (match) {
      var path = match[1];
      res.writeHead(200,
                    { 'Content-Type': 'text/event-stream' ,
                      'Cache-Control': 'no-cache',
                      'Connection': 'keep-alive' });
      var listener = function(data, event_type) {
        var json = JSON.stringify(data);
        if (event_type) {
          res.write("event: " + event_type + "\n");
        }
        res.write("data: " + json + "\n\n");
      };

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
