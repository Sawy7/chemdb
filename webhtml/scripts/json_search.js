var parsedjson;
var length;

var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var parsedjson = JSON.parse(this.responseText);
    length = parsedjson["Chemikalie"].length;
    var search = [];
    var alphabetically = true;
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
        document.getElementById("search_results").innerHTML += "<a href='index_access.html?index=" + formernum + "' class='collection-item'>" + sorted[i] + "</a>";
      }
    } else {
      for (i = 0; i < length; i++) {
        document.getElementById("search_results").innerHTML += "<a href='index_access.html?index=" + i + "' class='collection-item'>" + parsedjson["Chemikalie"][i]["nazev"] + "</a>";
      }
    }
    
    //latest results pull
    for (i = (length-1); i > (length-11); i--) {
      document.getElementById("latest_results").innerHTML += "<a href='index_access.html?index=" + i + "' class='collection-item'>" + parsedjson["Chemikalie"][i]["nazev"] + "</a>";
    }

    console.log("Search data is home, baby!");
    localStorage["parsedjson"] = JSON.stringify(parsedjson);
  }
};
xmlhttp.open("GET", "chemikalie_json.json", true);
xmlhttp.send();

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
