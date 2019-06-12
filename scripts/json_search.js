//All the required components loaded
const remote = require('electron').remote;
const app = remote.app;
var fs = require('fs');
var Client = require('node-ftp');
const path = require("path");
const request = require('request');
const ipcRenderer = require('electron').ipcRenderer;
const userData = app.getPath('userData');
var Mousetrap = require('mousetrap');

//Searching for upgrades
//Waiting for an updateReady message
ipcRenderer.on('updateReady', function(event, text) {
  // Changing the text of the button
  document.getElementById("upgradebox").style = "";
  sessionStorage["update"] = 1;
})
if (sessionStorage["update"] == 1) {
  document.getElementById("upgradebox").style = "";
}

var config = fs.readFileSync(path.resolve(__dirname, userData + "/config.json"));
var parsedconfig = JSON.parse(config);
if (parsedconfig["online-component"] == 0) {
  document.getElementById("setmodebutton").style = "display: none";
} else {
  document.getElementById("setupmodebutton").style = "display: none";
  loadsettings();
}
document.getElementById("versiontag").innerHTML += app.getVersion();

var parsedjson = JSON.parse(fs.readFileSync(path.resolve(__dirname, userData + "/chemikalie_json.json")));
var length = parsedjson["Chemikalie"].length;
var search = [];
var alphabetically = true;
function searchdata(collection) {
  document.getElementById(collection).innerHTML = "";
  printids = [];
  if (alphabetically == true) {
    var nonsorted = [];
    for (i = 0; i < length; i++) {
      nonsorted[i] = parsedjson["Chemikalie"][i]["nazev"];
    }
    var sorted = nonsorted.sort(function (a, b) {
      if (a.toLowerCase() < b.toLowerCase()) return -1;
      else if (a.toLowerCase() > b.toLowerCase()) return 1;
      return 0;
    });
    for (i = 0; i < length; i++) {
      var formernum;
      for (y = 0; y < length; y++) {
        if (sorted[i] == parsedjson["Chemikalie"][y]["nazev"]) {
          formernum = y;
        }
      }
      if (collection == "print_results") {
        document.getElementById(collection).innerHTML += "<a href='#' class='collection-item'><label><input type='checkbox' onClick='saveprint(this.id)' id=" + formernum + " /><span>" + sorted[i] + "</span></label></a>";
      } else if (collection == "search_results") {
        document.getElementById(collection).innerHTML += "<a href='index_access.html?index=" + formernum + "' class='collection-item'>" + sorted[i] + "</a>";
      }
    }
  } else {
    if (collection == "print_results") {
      for (i = 0; i < length; i++) {
        document.getElementById(collection).innerHTML += "<a href='#' class='collection-item'><label><input type='checkbox' onClick='saveprint(this.id)' id=" + i + " /><span>" + parsedjson["Chemikalie"][i]["nazev"] + "</span></label></a>";
      }
    } else if (collection = "search_results") {
      for (i = 0; i < length; i++) {
        document.getElementById(collection).innerHTML += "<a href='index_access.html?index=" + i + "' class='collection-item'>" + parsedjson["Chemikalie"][i]["nazev"] + "</a>";
      }
    }
  }
  if (collection == "print_results") {
    var printmodal = M.Modal.init(document.querySelector('#batchprintmode'));
    printmodal.open();
  } else if (collection == "search_results") {
    console.log("Search data is home, baby!");
  }
}
searchdata("search_results");

var stampok = 0;
checkstamps();
setInterval(checkstamps, 60000);
setInterval(lockdb, 10000);
webup();

function search_filter(section) {
  var input, filter, ul, li, a, i, bar, results;
  bar = section + "_bar";
  input = document.getElementById(bar);
  filter = input.value.toUpperCase();
  results = section + "_results";
  div = document.getElementById(results);
  a = div.getElementsByTagName('a');
  for (i = 0; i < a.length; i++) {
      b = a[i];
      if (b.innerHTML.toUpperCase().indexOf(filter) > -1) {
          a[i].style.display = "";
      } else {
          a[i].style.display = "none";
      }
  }
}

var isthisnew = false;
localStorage["isthisnew"] = JSON.stringify(isthisnew);

function showdiffadd(id, idrow) {
  if (document.getElementById(id).checked) {
    document.getElementById(idrow).style = "";
  } else {
    document.getElementById(idrow).style = "display: none";
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
        document.getElementById("lockbox").style = "display: none";
        document.getElementById("addbutton").style = "";
      } else {
        document.getElementById("lockbox").style = "";
        document.getElementById("addbutton").style = "display: none";
        itwasme = 0;
        sessionStorage["itwasme"] = itwasme;
      }
    });
  }
  else {
    document.getElementById("addbutton").style = "";
  }
  stampok = 1;
}

function webup() {
  var verurl = "http://" + parsedconfig.weburl + "/version.json";
  request(verurl, { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    console.log(body);
    if (body !== app.getVersion() && body < app.getVersion()) {
      document.getElementById("webupbox").style = "";
    }
  });
}

function webupdo() {
  setup(3);
  document.getElementById("webupbox").style = "display: none";
}

var printids = [];
function saveprint(id) {
  if (printids.length != 0) {
    var shoda = false;
    for (i = 0; i < printids.length; i++) {
      if (id == printids[i]) {
        shoda = true;
        var begone = printids.splice(i,1);
      }
    }
    if (shoda == false) {
      printids.push(id);
    }
  } else {
    printids.push(id);
  }
  console.log("Print: " + parsedjson["Chemikalie"][id]["nazev"]);
}
function dobatchprint() {
  localStorage["printids"] = JSON.stringify(printids);
  localStorage["x_dimension"] = document.getElementById("width").value;
  localStorage["y_dimension"] = document.getElementById("height").value;
  window.location.href = "print.html";
}

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
      if (nobox !== true) {
        if (remoteStamp < parsedconfig.timestamp) {
          document.getElementById("updateboxmsg").innerHTML = "Vzdálená databáze potřebuje aktualizaci.";
          document.getElementById("updateboxlink").href = "javascript:sync('local')";
          document.getElementById("updatebox").style = "";
          //sync(local); //Automatický upload databáze
        } else if (remoteStamp > parsedconfig.timestamp) {
          document.getElementById("updateboxmsg").innerHTML = "Lokální databáze je zastaralá.";
          document.getElementById("updateboxlink").href = "javascript:sync('remote')";
          document.getElementById("updatebox").style = "";
          //sync(remote); //Automatický download databáze
        }
      } else if (nobox == true) {
        parsedconfig.timestamp = remoteStamp;
        fs.writeFileSync(path.resolve(__dirname, userData + "/chemikalie_json.json"), JSON.stringify(parsedjson, null, 2));
        fs.writeFileSync(path.resolve(__dirname, userData + "/config.json"), JSON.stringify(parsedconfig, null, 2));
        window.location.reload();
      }
    });
  }
}

function sync(force) {
	if (force == "local") {
    if (itwasme == 1) {
      console.log("Tu je novější. Upload!");
      var timestampback = {
        "timestamp": parsedconfig.timestamp
      }
      fs.writeFileSync(path.resolve(__dirname, userData + "/timestamp.json"), JSON.stringify(timestampback, null, 2));
      //ftp srandy
    	var c = new Client();
    	c.on('ready', function() {
      		c.put(path.resolve(__dirname, userData + "/chemikalie_json.json"), 'chemikalie_json.json', function(err) {
      		    if (err) throw err;
        		  c.end();
      		});
          c.put(path.resolve(__dirname, userData + "/timestamp.json"), 'timestamp.json', function(err) {
            if (err) throw err;
            c.end();
          });
    	});
    	c.connect({host: parsedconfig["ip"], user: parsedconfig["user"], password: parsedconfig["password"]});
      remoteStamp = parsedconfig.timestamp;
  		console.log("upload hotov");
    }
	} else if (force == "remote") {
    console.log("Tam je novější. Download!");
    var jsonurl = "http://" + parsedconfig.weburl + "/chemikalie_json.json"
    request(jsonurl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var remoteChemikalie = JSON.parse(body);
        parsedjson = remoteChemikalie;
        checkstamps(true);
      }
    })
  }
  document.getElementById("updatebox").style = "display: none";
}

function setup(setcon) {
  if (setcon !== 3) {
    var configback = {
      "online-component": 1,
      "ip": "",
      "user": "",
      "password": "",
      "weburl": "",
      "timestamp": Date.now()
    }
    configback.ip = document.getElementById("ip").value;
    configback.user = document.getElementById("user").value;
    configback.password = document.getElementById("password").value;
    if (document.getElementById("addisdiff").checked == true) {
      configback.weburl = document.getElementById("weburl").value;
    } else {
      configback.weburl = document.getElementById("ip").value;
    }
    var timestampback = {
      "timestamp": configback.timestamp
    }
    fs.writeFileSync(path.resolve(__dirname, userData + "/timestamp.json"), JSON.stringify(timestampback, null, 2));
    remoteStamp = configback.timestamp;
    fs.writeFileSync(path.resolve(__dirname, userData + "/config.json"), JSON.stringify(configback, null, 2));
    parsedconfig = configback;
  }
  var version = app.getVersion();
  fs.writeFileSync(path.resolve(__dirname, userData + "/version.json"), JSON.stringify(version, null, 2));
  var c = new Client();
  c.on('error', function (err){
    if (err) {
      //zahodit všecko
      configback = {
        "online-component": 0
      }
      fs.writeFileSync(path.resolve(__dirname, userData + "/config.json"), JSON.stringify(configback, null, 2));
      parsedconfig = configback;
      var wrongftp = M.Modal.init(document.querySelector('#wrongftp'), {dismissable: false});
      askconmodal.close();
      wrongftp.open();
    }
  })
  if (setcon == 1 || setcon == 3) {
    fs.writeFileSync(path.resolve(__dirname, userData + "/version.json"), JSON.stringify(version, null, 2));
    //ftp srandy
    c.on('ready', function() {
      //load em loose files
      if (setcon == 1) {
        c.put(path.resolve(__dirname, userData + "/chemikalie_json.json"), 'chemikalie_json.json', function(err) {
          if (err) throw err;
          c.end();
        });
        c.mkdir('css', function(err) {
          if (err) throw err;
          c.end();
        });
        c.mkdir('js', function(err) {
          if (err) throw err;
          c.end();
        });
        c.mkdir('scripts', function(err) {
          if (err) throw err;
          c.end();
        });
        c.mkdir('graphics', function(err) {
          if (err) throw err;
          c.end();
        });
        c.cwd('graphics', function(err) {
          if (err) throw err;
          c.end();
        });
        c.mkdir('pictograms', function(err) {
          if (err) throw err;
          c.end();
        });
        c.cdup(function(err) {
          if (err) throw err;
          c.end();
        });
      }
      c.put(path.resolve(__dirname, userData + "/version.json"), 'version.json', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "statements_json.json"), 'statements_json.json', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "webhtml/index.html"), 'index.html', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "webhtml/index_access.html"), 'index_access.html', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "tabletest.html"), 'tabletest.html', function(err) {
        if (err) throw err;
        c.end();
      });
	    c.put(path.resolve(__dirname, userData + "/timestamp.json"), 'timestamp.json', function(err) {
        if (err) throw err;
        c.end();
      });
      //load css folder
      c.cwd('css', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "css/materialize.css"), 'materialize.css', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "css/materialize.min.css"), 'materialize.min.css', function(err) {
        if (err) throw err;
        c.end();
      });
      c.cdup(function(err) {
        if (err) throw err;
        c.end();
      });
      //load js folder
      c.cwd('js', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "js/jquery.min.js"), 'jquery.min.js', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "js/materialize.js"), 'materialize.js', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "js/materialize.min.js"), 'materialize.min.js', function(err) {
        if (err) throw err;
        c.end();
      });
      c.cdup(function(err) {
        if (err) throw err;
        c.end();
      });
      //load scripts folder
      c.cwd('scripts', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "webhtml/scripts/json_search.js"), 'json_search.js', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "webhtml/scripts/json_details.js"), 'json_details.js', function(err) {
        if (err) throw err;
        c.end();
      });
      c.cdup(function(err) {
        if (err) throw err;
        c.end();
      });
      //load graphics folder
      c.cwd('graphics', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/search_icon.png"), 'search_icon.png', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/logo.svg"), 'logo.svg', function(err) {
        if (err) throw err;
        c.end();
      });
      c.cwd('pictograms', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/pictograms/13.svg"), '13.svg', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/pictograms/15.svg"), '15.svg', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/pictograms/17.svg"), '17.svg', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/pictograms/19.svg"), '19.svg', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/pictograms/21.svg"), '21.svg', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/pictograms/23.svg"), '23.svg', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/pictograms/25.svg"), '25.svg', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/pictograms/27.svg"), '27.svg', function(err) {
        if (err) throw err;
        c.end();
      });
      c.put(path.resolve(__dirname, "graphics/pictograms/29.svg"), '29.svg', function(err) {
        if (err) throw err;
        c.end();
      });
    });
    c.connect({host: parsedconfig["ip"], user: parsedconfig["user"], password: parsedconfig["password"]});
    console.log("instalace, yes");
  } else {
    c.connect({host: parsedconfig["ip"], user: parsedconfig["user"], password: parsedconfig["password"]});
    var askconmodal = M.Modal.init(document.querySelector('#askconmode'));
    askconmodal.open();
    console.log("no instalace");
  }
  document.getElementById("setmodebutton").style = "";
  document.getElementById("setupmodebutton").style = "display: none";
  loadsettings();
}

function loadsettings () {
  document.getElementById("ip_edit").value = parsedconfig["ip"];
  document.getElementById("user_edit").value = parsedconfig["user"];
  document.getElementById("password_edit").value = parsedconfig["password"];
  if (parsedconfig["ip"] !== parsedconfig["weburl"]) {
    document.getElementById("addisdiff_edit").checked = true;
    document.getElementById("diffaddrow_edit").style = "";
    document.getElementById("weburl_edit").value = parsedconfig["weburl"];
  }
  M.updateTextFields();
}

function settings () {
  var configback = {
    "online-component": 1,
    "ip": "",
    "user": "",
    "password": "",
    "weburl": "",
    "timestamp": ""
  }
  configback.ip = document.getElementById("ip_edit").value;
  configback.user = document.getElementById("user_edit").value;
  configback.password = document.getElementById("password_edit").value;
  if (document.getElementById("addisdiff_edit").checked == true) {
    configback.weburl = document.getElementById("weburl_edit").value;
  } else {
    configback.weburl = document.getElementById("ip_edit").value;
  }
  configback.timestamp = parsedconfig["timestamp"];
  fs.writeFileSync(path.resolve(__dirname, userData + "/config.json"), JSON.stringify(configback, null, 2));
  parsedconfig = configback;
  window.location.reload();
}

function removeconfig() {
  var configback = {
    "online-component": 0,
    "timestamp": parsedconfig.timestamp
  }
  fs.writeFileSync(path.resolve(__dirname, userData + "/config.json"), JSON.stringify(configback, null, 2));
  parsedconfig = configback;
  window.location.reload();
}


function newentry() {
  var newobj = {
    "nazev": "",
    "vzorec": "",
    "trivialne": "-",
    "mnozstvi": "",
    "jednotka": "g",
    "cistota": "",
    "explosive": "0",
    "flammable": "0",
    "oxidising": "0",
    "gasunderpressure": "0",
    "corrosive": "0",
    "toxicity": "0",
    "health": "0",
    "chronichealth": "0",
    "environmental": "0",
    "poznamka": "",
    "vyloucit": "0"
  }
  newobj.nazev = document.getElementById("nazev_edit").value;
  parsedjson["Chemikalie"].push(newobj);
  fs.writeFileSync(path.resolve(__dirname, userData + "/chemikalie_json.json"), JSON.stringify(parsedjson, null, 2));
  isthisnew = true;
  localStorage["isthisnew"] = JSON.stringify(isthisnew);
  window.location.href = "index_access.html?index=" + length;
}

function runninglow() {
  document.getElementById("low_results").innerHTML = "";
  var mnozstvi;
  var hranice = document.getElementById("hranice_edit").value;
  console.log(hranice);
  for (var i = 0; i <= hranice; i++) {
    for (var y = 0; y < length; y++) {
      mnozstvi = parseFloat(parsedjson["Chemikalie"][y]["mnozstvi"]);
      if (mnozstvi == i) {
        if (typeof parsedjson["Chemikalie"][y]["jednotka"] !== "undefined") {
          document.getElementById("low_results").innerHTML += "<a href='index_access.html?index=" + y + "' class='collection-item'>" + parsedjson["Chemikalie"][y]["nazev"] + " (" + parsedjson["Chemikalie"][y]["mnozstvi"] + " " + parsedjson["Chemikalie"][y]["jednotka"] + ")" + "</a>";
        } else {
          document.getElementById("low_results").innerHTML += "<a href='index_access.html?index=" + y + "' class='collection-item'>" + parsedjson["Chemikalie"][y]["nazev"] + " (" + parsedjson["Chemikalie"][y]["mnozstvi"] + " " + "[bez jednotky]" + ")" + "</a>";
        }
      }
    }
  }
}

//Keyboard goodness
Mousetrap.bind("esc", function() { console.log("i haz board supor"); });
Mousetrap.bind("ctrl+space", function() { console.log("usful shiz vry sun"); });

Mousetrap.bind(";", function() { napoveda_kb(); });
function napoveda_kb() {
  var newmodal = M.Modal.init(document.querySelector('#napoveda'));
  newmodal.open();
}

Mousetrap.bind("ctrl+n", function() { new_kb(); });
function new_kb() {
  var newmodal = M.Modal.init(document.querySelector('#askmode'));
  newmodal.open();
}

Mousetrap.bind("ctrl+q", function() { mnozstvi_kb(); });
function mnozstvi_kb() {
  var newmodal = M.Modal.init(document.querySelector('#lowmode'));
  newmodal.open();
}

Mousetrap.bind("ctrl+l", function() { focus_kb(); });
function focus_kb() {
  document.getElementById("search_bar").focus();
}

Mousetrap.bind("ctrl+i", function() { releasenotes_kb(); });
function releasenotes_kb() {
  var newmodal = M.Modal.init(document.querySelector('#releasenotes'));
  newmodal.open();
}

Mousetrap.bind("ctrl+p", function() { releasenotes_kb(); });
function releasenotes_kb() {
  searchdata("print_results");
}