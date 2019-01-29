var app = require('electron').remote;
var fs = require('fs');
var txt = fs.readFileSync('../testjson.json', 'utf8');
var additional = JSON.parse(txt);
var newobj = {
  "nazev": "",
  "vzorec": "",
  "trivialne": "-",
  "mnozstvi": "",
  "jednotka": "",
  "cistota": "",
  "C": "",
  "E": "",
  "F": "",
  "N": "",
  "O": "",
  "T": "",
  "T+": "",
  "Xi": "",
  "Xn": "",
  "vyloucit": ""
}
additional["Chemikalie"].push(newobj);
console.log(additional["Chemikalie"][306]["vzorec"]);
newobj.vzorec = "dimdimdu";
console.log(additional["Chemikalie"][306]["vzorec"]);
