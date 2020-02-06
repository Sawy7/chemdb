const webview = document.querySelector('webview');
webview.addEventListener('dom-ready', () => {
  //webview.openDevTools();
  shift(0, "leftv");
  shift(0, "topv");
})

webview.addEventListener('ipc-message', (event) => {
  if (event.channel == "poschanged") {
    fetchpos();
  }
})
function fetchpos() {
  var left = localStorage["leftpos"].substring(0, localStorage["leftpos"].length - 2);
  var top = localStorage["toppos"].substring(0, localStorage["toppos"].length - 2);
  document.getElementById("leftv").value = parseFloat(left).toFixed(2);;
  leftslider.noUiSlider.set(left);
  document.getElementById("topv").value = parseFloat(top).toFixed(2);  
  topslider.noUiSlider.set(top);
}

var topmax = 29.7-localStorage["y_dimension"];
var leftmax = 21-localStorage["x_dimension"];

var topslider = document.getElementById('topslider');
noUiSlider.create(topslider, {
  start: [0],
  step: 0.1,
  range: {
      'min': [0],
      'max': [topmax]
  },
  tooltips: false,
  orientation: "vertical"
});

var leftslider = document.getElementById('leftslider');
noUiSlider.create(leftslider, {
  start: [0],
  step: 0.1,
  range: {
      'min': [0],
      'max': [leftmax]
  },
  tooltips: false,
  orientation: "horizontal"
});

function shift(slider, id) {
  var leftv = document.getElementById("leftv").value;
  var rightv = document.getElementById("rightv").value;
  var topv = document.getElementById("topv").value;
  var botv = document.getElementById("botv").value;

  var element = document.getElementById(id);
  if (id == "topv") {
    topv = overflow(element.value, "vertical");
    element.value = topv;
    botv = 29.7-topv-localStorage["y_dimension"];
    document.getElementById("botv").value = botv.toFixed(2);
  } else if (id == "botv")
  {
    botv = overflow(element.value, "vertical");
    element.value = botv;
    topv = 29.7-botv-localStorage["y_dimension"];
    document.getElementById("topv").value = topv.toFixed(2);
  } else if (id == "leftv")
  {
    leftv = overflow(element.value, "horizontal");
    element.value = leftv;
    rightv = 21-leftv-localStorage["x_dimension"];
    document.getElementById("rightv").value = rightv.toFixed(2);
  } else if (id == "rightv")
  {
    rightv = overflow(element.value, "horizontal");
    element.value = rightv;
    leftv = 21-rightv-localStorage["x_dimension"];
    document.getElementById("leftv").value = leftv.toFixed(2);
  }

  if (slider != 1) {
    topslider.noUiSlider.set(topv);
    leftslider.noUiSlider.set(leftv);
    //document.getElementById("leftslider").value = leftv;
  }
  
  webview.executeJavaScript("shiftrec("+ leftv +", " + topv + ")");
}

function overflow(val, direction) {
  if (direction == "vertical") {
    if (val < 0) {
      val = 0;
    } else if (val > 29.7-localStorage["y_dimension"]) {
      val = 29.7-localStorage["y_dimension"];
    }
  } else {
    if (val < 0) {
      val = 0;
    } else if (val > 21-localStorage["x_dimension"]) {
      val = 21-localStorage["x_dimension"];
    }
  }
  return val;
}

//var leftslider = document.getElementById("leftslider");
leftslider.noUiSlider.on('slide', function (values, handle) {
  var value = values[handle];
  document.getElementById("leftv").value = value;
  shift(1, "leftv");  
});

//var topslider = document.getElementById("topslider");
topslider.noUiSlider.on('slide', function (values, handle) {
  var value = values[handle];
  document.getElementById("topv").value = value;
  shift(1, "topv");  
});


function leftwide() {
  var current = parseFloat(document.getElementById("leftv").value);
  var shifted = current - parseFloat(localStorage["x_dimension"]);
  document.getElementById("leftv").value = shifted.toFixed(2);
  shift(0, "leftv");
}

function rightwide() {
  var current = parseFloat(document.getElementById("leftv").value);
  var shifted = current + parseFloat(localStorage["x_dimension"]);
  document.getElementById("leftv").value = shifted.toFixed(2);
  shift(0, "leftv");
}

function uphigh() {
  var current = parseFloat(document.getElementById("topv").value);
  var shifted = current - parseFloat(localStorage["y_dimension"]);
  document.getElementById("topv").value = shifted.toFixed(2);
  shift(0, "topv");
}

function downhigh() {
  var current = parseFloat(document.getElementById("topv").value);
  var shifted = current + parseFloat(localStorage["y_dimension"]);
  document.getElementById("topv").value = shifted.toFixed(2);
  shift(0, "topv");
}

function printcmd() {
  webview.executeJavaScript("printit()");
}

function shiftall(wide) {
  webview.executeJavaScript("shiftrecall(" + wide + ")");
  webview.executeJavaScript("selector(selected)");
}