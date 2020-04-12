import * as Cesium from "../Source/Cesium.js";

function hexToRGB(string) {
  function hexToR(h) {
    return parseInt(cutHex(h).substring(0, 2), 16);
  }
  function hexToG(h) {
    return parseInt(cutHex(h).substring(2, 4), 16);
  }
  function hexToB(h) {
    return parseInt(cutHex(h).substring(4, 6), 16);
  }
  function hexToAlpha(h) {
    h = cutHex(h);
    let sub = h.substring(6, 8);
    if (!sub) return 1;
    else return parseInt(sub, 16) / 255;
  }
  function cutHex(h) {
    return h.charAt(0) == "#" ? h.substring(1, h.length) : h;
  }
  let r = hexToR(string);
  let g = hexToG(string);
  let b = hexToB(string);
  let alpha = hexToAlpha(string);
  return { r, g, b, alpha };
}

function stringToRGBObject(string, alpha) {
  if (string.includes("rgb")) {
    let v = string.split(/[(,)]/);
    let r = +v[1],
      g = +v[2],
      b = +v[3];
    if (!alpha) alpha = v[0] === "rgba" ? +v[4] : 1;
    return { r, g, b, alpha };
  }
}

export function stringToCesiumColor(string, alpha) {
  if (typeof string !== "string") return string;
  if (string[0] === "#") {
    let v = hexToRGB(string);
    let { r, g, b } = v;
    let intV = RGBToIntegerObject({ r, g, b });
    if (!alpha) alpha = v.alpha ? v.alpha : 1;
    return new Cesium.Color(intV.r, intV.g, intV.b).withAlpha(alpha);
  } else if (string.includes("rgb")) {
    let v = string.split(/[(,)]/);
    let r = +v[1],
      g = +v[2],
      b = +v[3];
    if (!alpha) alpha = v[0] === "rgba" ? +v[4] : 1;
    let intV = RGBToIntegerObject({ r, g, b });
    return new Cesium.Color(intV.r, intV.g, intV.b).withAlpha(alpha);
  } else {
    return Cesium.Color[string.toUpperCase()].withAlpha(alpha);
  }
}

function RGBToIntegerObject(obj) {
  let newObj = {};
  Object.keys(obj).forEach((k) => {
    newObj[k] = obj[k] / 255;
  });
  return newObj;
}

function RGBToIntegerArray(arr) {
  return arr.map((x) => x / 255);
}
function integerToRGBArray(arr) {
  return arr.map((x) => x * 255);
}

function integerToRGBObject(obj) {
  let newObj = {};
  Object.keys(obj).forEach((k) => {
    newObj[k] = obj[k] * 255;
  });
  return newObj;
}
function RGBObjectToString(obj) {
  let { red, green, blue, r, g, b, R, G, B } = obj;
  red = red || r || R;
  green = green || g || G;
  blue = blue || b || B;
  return `rgb(${red},${green},${blue})`;
}
function RGBArrayToString(arr) {
  return `rgb(${arr[0]},${arr[1]},${arr[2]})`;
}
