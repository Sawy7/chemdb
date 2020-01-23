//All the required components loaded
const remote = require('electron').remote;
const app = remote.app;
var fs = require('fs');
var Client = require('node-ftp');
const path = require("path");
const request = require('request');
const userData = app.getPath('userData');
var stampok = 0;

checkstamps();
setInterval(checkstamps, 60000);
setInterval(lockdb, 10000);
var remoteStamp;

function checkstamps(nobox) {
    if (parsedconfig["online-component"] == 1) {
        var timeurl = "http://" + parsedconfig.weburl + "/timestamp.json";
        request(timeurl, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            console.log(body.timestamp);
            remoteStamp = body.timestamp;
            if (stampok == 0) {
                lockdb();
            }
        });
    }
}

if (typeof sessionStorage["itwasme"] == "undefined") {
    var itwasme = 0;
} else {
    var itwasme = sessionStorage["itwasme"];
}
  
var abandonlock;
function lockdb() {
    if (parsedconfig["online-component"] == 1) {
        var lockurl = "http://" + parsedconfig.weburl + "/timestamp.json";
        request(lockurl, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            remoteLock = body.lockstamp;
            abandonlock = body.abandonlock;
            var delta;
            var lastclaim;
            if (typeof remoteLock !== "undefined") {
                delta = Date.now() - remoteLock;
            } else {
                delta = 91000;
            }
            lastclaim = JSON.parse(fs.readFileSync(path.resolve(__dirname, userData + "/lastclaim.json")));
            if (lastclaim == remoteLock & itwasme == 0) {
                console.log("Last login")
                itwasme = 1;
                sessionStorage["itwasme"] = itwasme;
            }
            console.log("deltasec: " + delta/1000);
            if (delta > 90000 || itwasme == 1 || abandonlock == 1) {
                if (itwasme !== 1) {
                    itwasme = 1;
                    sessionStorage["itwasme"] = itwasme;
                }
                var timestampback = {
                "timestamp": remoteStamp,
                "lockstamp": Date.now(),
                "abandonlock": 0
                }
                lastclaim = timestampback.lockstamp;
                fs.writeFileSync(path.resolve(__dirname, userData + "/lastclaim.json"), JSON.stringify(lastclaim, null, 2));
                fs.writeFileSync(path.resolve(__dirname, userData + "/timestamp.json"), JSON.stringify(timestampback, null, 2));
                var c = new Client();
                c.on('ready', function() {
                    c.put(path.resolve(__dirname, userData + "/timestamp.json"), 'timestamp.json', function(err) {
                        if (err) throw err;
                        c.end();
                    });
                });
                c.connect({host: parsedconfig["ip"], user: parsedconfig["user"], password: parsedconfig["password"]});
                //document.getElementById("lockbox").style = "display: none";
                document.getElementById("editbutton").style = "";
            } else {
                //document.getElementById("lockbox").style = "";
                document.getElementById("editbutton").style = "display: none";
                itwasme = 0;
                sessionStorage["itwasme"] = itwasme;
            }
        });
    }
    else {
      document.getElementById("editbutton").style = "";
    }
    stampok = 1;
}