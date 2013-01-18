rivulet
=======

[![Build Status](https://travis-ci.org/bthesorceror/rivulet.png?branch=master)](undefined)

Middleware for [journeyman][] to simplify server sent events

Client Side:
====================================

```html

  <html>
    <head>
      <script type='text/javascript' src='/rivulets/event-source.js' />
      <script type='text/javascript'>
        var eventsource = new EventSource('/rivulets/test');

        eventsource.addEventListener('alert', function(message) {
          alert("Alert: " + message);
        });

        eventsource.addEventListener('message', function(message) {
          alert("Message: " + message);
        });
      </script>
    </head>
    <body>
      <h1>Test Page</h1>
    </body>
  </html>

```

ServerSide:
===========================================

```javascript

var Rivulet      = require('rivulet');
var Journeyman   = require('journeyman');
var EventEmitter = require('events').EventEmitter;

var journeyman = new Journeyman(3000);
var emitter    = new EventEmitter();
var options    = {
  hub: emitter
};

var rivulet = new Rivulet(options);

journeyman.use(function(req, res, next) {
  // render html page
});

journeyman.use(rivulet.middleware());
journeyman.listen();

```

To show an alert of "Alert: HELLO WORLD"

```javascript

emitter.emit('rivulets', 'test', 'HELLO WORLD', 'alert');

```

To show an alert of "Message: HELLO WORLD"

```javascript

emitter.emit('rivulets', 'test', 'HELLO WORLD');

```

Thanks to Yaffle for the event source polyfill which can be found [here](https://github.com/Yaffle/EventSource)

[journeyman]: https://github.com/bthesorceror/journeyman
