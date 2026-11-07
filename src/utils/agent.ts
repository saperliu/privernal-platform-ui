export function isPC() {
  const agents = ['Android', 'iPhone', 'webOS', 'BlackBerry', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod'];

  const isMobile = agents.some(agent => window.navigator.userAgent.includes(agent));

  return !isMobile;
}

export function getQueryString(url: string, name: string) {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, 'i');
  const r = url.substring(1).match(reg);
  if (r !== null) {
    return decodeURI(r[2]);
  }
  return null;
}
