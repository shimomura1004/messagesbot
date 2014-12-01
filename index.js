var WebSocketServer = require('ws').Server
var fs = require('fs');
var tmp = require('tmp');
var exec = require('child_process').exec;

function createScript(data){
  var script = [];

  // generate applescript
  script.push('tell application "Messages"');
  script.push('  activate');
  script.push('end tell');
  script.push('');
  script.push('delay 0.5');
  script.push('');

  script.push('tell application "System Events"');

  script.push('  keystroke "n" using {command down}');
  script.push('  delay 0.8');
  script.push('');

  for(var i=0; i < data.to.length; i++) {
    script.push('  keystroke "' + data.to[i] + '"');
    script.push('  delay 0.5');
    script.push('  keystroke return');
    script.push('  delay 0.1');
    script.push('  ');
  }

  script.push('  keystroke tab');
  script.push('  delay 0.1');

  script.push('  keystroke "v" using {command down}');
  script.push('  delay 0.5');
  script.push('  keystroke return');

  script.push('end tell');

  return script.join('\n');
}

var wss = new WebSocketServer({port: 8080});
wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    try {
      var data = JSON.parse(message);
      var applescript = createScript(data);

      tmp.tmpName({template: '/tmp/script-XXXXXX'}, function (err, path) {
        if (err) throw err;

        // write applescript
        fs.writeFileSync(path, applescript);

        // save message body to clipboard
        if (typeof(data.body) === "object") {
          data.body = data.body.join('\n');
        }
        exec('echo "' + data.body + '" | pbcopy', function(){
          // execute the applescript
          exec('osascript ' + path, function(err, stdout, stderr) {
            if (err) {
              console.log("stdout:" + stdout);
              console.log("stderr:" + stderr);
            }
          });
        });
      });
    }
    catch (e) {
      ws.send("" + e);
      console.log(e);
    }
  });
});
