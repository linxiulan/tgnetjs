var ie = !!window.ActiveXObject;
var ie6 = ie && !window.XMLHttpRequest,
    ie7 = ie && !!window.XMLHttpRequest && (!document.documentMode || (document.documentMode == 7));
module.exports = {
    ie: ie,
    ie6: ie6,
    ie7: ie7,
    ie8: ie && !!window.VBArray && !ie6 && !ie7,
    mobile: !!/AppleWebKit/.test(navigator.userAgent)
};