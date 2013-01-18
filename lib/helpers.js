function superProxyMe(func, context) {
  return function() {
    func.apply(context, arguments);
  }
}

function generateListener(res) {
  return function(data, event_type) {
    var json = JSON.stringify(data);
    event_type && res.write("event: " + event_type + "\n");
    res.write("data: " + json + "\n\n");
  };
}

module.exports = {
  superProxyMe: superProxyMe,
  generateListener: generateListener
}
