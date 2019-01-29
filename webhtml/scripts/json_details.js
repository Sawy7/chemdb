var vars = {};
var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
});

var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var parsedjson = JSON.parse(this.responseText);
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

    document.getElementById("mnozstvi").innerHTML = "<b>Množství: </b>" + data.mnozstvi + " " + data.jednotka;
    document.getElementById("cistota").innerHTML = "<b>Čistota: </b>" + data.cistota;

    var pictograms = [x["explosive"], x["flammable"], x["oxidising"], x["gasunderpressure"], x["corrosive"], x["toxicity"], x["chronichealth"], x["health"], x["environmental"]];
    var pictonumbers = [13, 15, 17, 19, 21, 23, 25, 27, 29];
    for (i = 0; i < pictograms.length; i++) {
      if (pictograms[i] != 0) {
        data.pictograms += "<img src='graphics/pictograms/" + pictonumbers[i] + ".svg' height='50px' width='50px'>";
      }
    }
    if (data.pictograms != "") {
      document.getElementById("card-pictograms").innerHTML = "<h6>Nebezpečí</h6>" + data.pictograms
    }

    //statements
    var xmlhttp_stat = new XMLHttpRequest();
    xmlhttp_stat.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        var parsedStatements = JSON.parse(this.responseText);
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
      }
    };
    xmlhttp_stat.open("GET", "../statements_json.json", true);
    xmlhttp_stat.send();

    var urlsend = 'https://api.qrserver.com/v1/create-qr-code/?data=' + document.location.origin + '/index_access.html?index=' + vars["index"] + '&amp;size=50x50';
    document.getElementById("qrhere").src = urlsend;
    data.qrtag = document.getElementById("qrhere").outerHTML;

    localStorage["data"] = JSON.stringify(data);
  }
};
xmlhttp.open("GET", "../chemikalie_json.json", true);
xmlhttp.send();

function print() {
  document.getElementById("printframe").src = "tabletest.html";
  //window.location.href = "tabletest.html";
}
