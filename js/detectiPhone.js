export function isIos() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export function isInStandaloneMode() {
  return "standalone" in window.navigator && window.navigator.standalone;
}

export function detectWindowOrientation() {
  let smH = window.innerHeight <= 700,
    smW = window.innerWidth <= 700,
    winO;
  if (smH && !smW) winO = "landscape";
  if (!smH && smW) winO = "portrait";
  if (!smH && !smW && window.ontouchstart === undefined) winO = undefined;
  if (window.orientation !== undefined) {
    Math.abs(window.orientation) === 90
      ? (winO = "landscape")
      : (winO = "portrait");
  }
  return winO;
}
