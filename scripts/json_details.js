const remote = require('electron').remote;
const app = remote.app;
var fs = require('fs');
var Client = require('node-ftp');
const path = require("path");
const request = require('request');
const userData = app.getPath('userData');

var myjson = fs.readFileSync(path.resolve(__dirname, userData + "/chemikalie_json.json"));
var parsedjson = JSON.parse(myjson);

var config = fs.readFileSync(path.resolve(__dirname, userData + "/config.json"));
var parsedconfig = JSON.parse(config);

var vars = {};
var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
});

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

function lockdb() {
  if (parsedconfig["online-component"] == 1) {
    var lockurl = "http://" + parsedconfig.weburl + "/timestamp.json";
    request(lockurl, { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      remoteLock = body.lockstamp;
      var delta;
      if (typeof remoteLock !== "undefined") {
        delta = Date.now() - remoteLock;
      } else {
        delta = 91000;
      }
      console.log("deltasec: " + delta/1000);
      if (delta > 90000 || itwasme == 1) {
        if (itwasme !== 1) {
          itwasme = 1;
          sessionStorage["itwasme"] = itwasme;
        }
        var timestampback = {
          "timestamp": remoteStamp,
          "lockstamp": Date.now()
        }
        localStorage["lastclaim"] = timestampback.lockstamp;
        fs.writeFileSync(path.resolve(__dirname, "webhtml/timestamp.json"), JSON.stringify(timestampback, null, 2));
        var c = new Client();
      	c.on('ready', function() {
            c.put(path.resolve(__dirname, "webhtml/timestamp.json"), 'timestamp.json', function(err) {
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

var x = parsedjson["Chemikalie"][vars["index"]];

data = {
  nazev: x["nazev"],
  vzorec: "[" + x["vzorec"] + "]",
  trivialne: "(" + x["trivialne"] + ")",
  mnozstvi: x["mnozstvi"],
  jednotka: x["jednotka"],
  cistota: x["cistota"],
  qrtag: "",
  poznamka: "",
  poznamkaraw: x["poznamka"],
  molarnih: "",
  pictograms: ""
}

var char;
var vzorecformated = "";
var cislo = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
for (i = 0; i < data.vzorec.length; i++) {
  char = data.vzorec.charAt(i);
  for (y = 0; y < cislo.length; y++) {
    if (i !== 0 && char == cislo[y]) {
      if (data.vzorec.charAt(i-1) !== ".") {
        char = "<sub>" + char + "</sub>";
      }
    }
  }
  if (char == ".") {
    char = " · ";
  }
  vzorecformated += char;
}
document.getElementById("nazev").innerHTML = "<h3>" + data.nazev + "</h3>" + " " + vzorecformated;
if (data.trivialne != "(-)") {
  document.getElementById("nazev").innerHTML += " " + data.trivialne;
}

//dodelat databazi hmotnosti a vypocet
//document.getElementById("molarhmotnost").innerHTML = data.molarnih;

if (data.mnozstvi !== "") {
  document.getElementById("mnozstvi").innerHTML = "<b>Množství: </b>" + data.mnozstvi + " " + data.jednotka;
}
if (data.cistota !== "") {
  document.getElementById("cistota").innerHTML = "<b>Čistota: </b>" + data.cistota;
}

var pictograms = [x["explosive"], x["flammable"], x["oxidising"], x["gasunderpressure"], x["corrosive"], x["toxicity"], x["health"], x["chronichealth"], x["environmental"]];
var pictonumbers = [13, 15, 17, 19, 21, 23, 25, 27, 29];
for (i = 0; i < pictograms.length; i++) {
  if (pictograms[i] != 0) {
    data.pictograms += "<img src='graphics/pictograms/" + pictonumbers[i] + ".svg' height='50px' width='50px'>";
  }
}
if (data.pictograms != "") {
  document.getElementById("card-pictograms").innerHTML = "<h6>Nebezpečí</h6>" + data.pictograms
}
var statements = fs.readFileSync(path.resolve(__dirname, "statements_json.json"));
var parsedStatements = JSON.parse(statements);
var statementsLength = parsedStatements["Statements"].length;
if (typeof data.poznamkaraw !== "undefined") {
  for (i = 0; i < statementsLength; i++) {
    if (data.poznamkaraw.includes(parsedStatements["Statements"][i]["code"]) || data.poznamkaraw.includes(parsedStatements["Statements"][i]["code"].replace(/\s/g, ''))) {
      if (data.poznamkaraw.includes(parsedStatements["Statements"][i]["code"] + " +") || data.poznamkaraw.includes(parsedStatements["Statements"][i]["code"] + "+") || data.poznamkaraw.includes("+ " + parsedStatements["Statements"][i]["code"]) || data.poznamkaraw.includes("+" + parsedStatements["Statements"][i]["code"])) {
      }
      else {
        data.poznamka = data.poznamka + parsedStatements["Statements"][i]["code"] + ": " + parsedStatements["Statements"][i]["phrase"] + " ";
      }
    }
  }
  if (data.poznamka != "") {
    document.getElementById("poznamka").innerHTML = data.poznamka;
  }
}

var urlsend;
if (typeof parsedconfig.weburl !== "undefined") {
  urlsend = 'https://api.qrserver.com/v1/create-qr-code/?data=' + 'http://' + parsedconfig.weburl + '/index_access.html?index=' + vars["index"] + '&amp;size=50x50';
} else {
  urlsend = 'graphics/qr_error.png'
}
document.getElementById("qrhere").src = urlsend;
data.qrtag = document.getElementById("qrhere").outerHTML;

localStorage["data"] = JSON.stringify(data);

function print() {
  document.getElementById("printframe").src = "tabletest.html";
}

var switches = ["explosive", "flammable", "oxidising", "gasunderpressure", "corrosive", "toxicity", "health", "chronichealth", "environmental"];

isthisnew = JSON.parse(localStorage["isthisnew"]);
if (isthisnew == true) {
  isthisnew = false;
  localStorage["isthisnew"] = JSON.stringify(isthisnew);
  settimestamp();
  editmode();
}

function editmode() {
  document.getElementById("showmode").style = "display: none";
  document.getElementById("editmodebutton").style = "display: none";
  document.getElementById("editmode").style = "";
  document.getElementById("nazev_edit").value = x["nazev"];
  document.getElementById("vzorec_edit").value = x["vzorec"];
  document.getElementById("trivialne_edit").value = x["trivialne"];
  document.getElementById("mnozstvi_edit").value = x["mnozstvi"];
  document.getElementById("jednotka_edit").value = x["jednotka"];
  document.getElementById("cistota_edit").value = x["cistota"];
  document.getElementById("poznamkaraw_edit").value = x["poznamka"];
  for (i = 0; i < 9; i++) {
    var element = switches[i] + "_edit";
    if (x[switches[i]] == 1) {
      document.getElementById(element).checked = true;
    }
  }
  M.updateTextFields();
}

function endeditmode() {
  document.getElementById("showmode").style = "";
  document.getElementById("editmodebutton").style = "";
  document.getElementById("editmode").style = "display: none";
}

function todatrash() {
  parsedjson["Chemikalie"].splice(vars["index"],1);
  fs.writeFileSync(path.resolve(__dirname, userData + "/chemikalie_json.json"), JSON.stringify(parsedjson, null, 2));
  settimestamp();
  window.location.href = "index.html";
}

function settimestamp() {
  var configback = parsedconfig;
  configback.timestamp = Date.now();
  fs.writeFileSync(path.resolve(__dirname, userData + "/config.json"), JSON.stringify(configback, null, 2));
  parsedconfig = configback;
}

function saveandexit() {
  x["nazev"] = document.getElementById("nazev_edit").value;
  x["vzorec"] = document.getElementById("vzorec_edit").value;
  x["trivialne"] = document.getElementById("trivialne_edit").value;
  x["mnozstvi"] = document.getElementById("mnozstvi_edit").value;
  x["jednotka"] = document.getElementById("jednotka_edit").value;
  x["cistota"] = document.getElementById("cistota_edit").value;
  x["poznamka"] = document.getElementById("poznamkaraw_edit").value;
  for (i = 0; i < 9; i++) {
    var element = switches[i] + "_edit"
    if (document.getElementById(element).checked == true) {
      x[switches[i]] = "1";
    } else {
      x[switches[i]] = "0";
    }
  }
  fs.writeFileSync(path.resolve(__dirname, userData + "/chemikalie_json.json"), JSON.stringify(parsedjson, null, 2));
  settimestamp();
  window.location.reload();
}

function automat() {
  var element;
  var currentStatement;
  for (i = 0; i < 9; i++) {
    element = switches[i] + "_edit";
    document.getElementById(element).checked = false;
  }
  if (typeof data.poznamkaraw !== "undefined") {
    var poznamkaraw_edit_value = document.getElementById("poznamkaraw_edit").value;
    for (i = 0; i < statementsLength; i++) {
      currentStatement = parsedStatements["Statements"][i]["code"];
      if (poznamkaraw_edit_value.includes(currentStatement) || poznamkaraw_edit_value.includes(currentStatement.replace(/\s/g, ''))) {
        if (poznamkaraw_edit_value.includes(currentStatement + " +") || poznamkaraw_edit_value.includes(currentStatement + "+") || poznamkaraw_edit_value.includes("+ " + currentStatement) || poznamkaraw_edit_value.includes("+" + currentStatement)) {
        }
        else {
          for (y = 0; y < switches.length; y++) {
            if (parsedStatements["Statements"][i]["pictogram"] == switches[y]) {
              element = switches[y] + "_edit";
              document.getElementById(element).checked = true;
            }
          }
          if (parsedStatements["Statements"][i]["pictogram"] == "explosive_flammable") {
            document.getElementById("explosive_edit").checked = "true";
            document.getElementById("flammable_edit").checked = "true";
          }
        }
      }
    }
  }
}
