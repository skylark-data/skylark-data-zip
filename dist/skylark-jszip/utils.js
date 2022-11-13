/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-binary/buffer","./support","./base64","./external"],function(r,n,t,e){"use strict";var a={};function o(r){return r}function u(r,n){for(var t=0;t<r.length;++t)n[t]=255&r.charCodeAt(t);return n}a.newBlob=function(r,n){a.checkSupport("blob");try{return new Blob([r],{type:n})}catch(e){try{var t=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return t.append(r),t.getBlob(n)}catch(r){throw new Error("Bug : can't construct the Blob.")}}};var f={stringifyByChunk:function(r,n,t){var e=[],a=0,o=r.length;if(o<=t)return String.fromCharCode.apply(null,r);for(;a<o;)"array"===n||"nodebuffer"===n?e.push(String.fromCharCode.apply(null,r.slice(a,Math.min(a+t,o)))):e.push(String.fromCharCode.apply(null,r.subarray(a,Math.min(a+t,o)))),a+=t;return e.join("")},stringifyByChar:function(r){for(var n="",t=0;t<r.length;t++)n+=String.fromCharCode(r[t]);return n},applyCanBeUsed:{uint8array:function(){try{return n.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(r){return!1}}(),nodebuffer:function(){try{return n.nodebuffer&&1===String.fromCharCode.apply(null,r.alloc(1)).length}catch(r){return!1}}()}};function i(r){var n=65536,t=a.getTypeOf(r),e=!0;if("uint8array"===t?e=f.applyCanBeUsed.uint8array:"nodebuffer"===t&&(e=f.applyCanBeUsed.nodebuffer),e)for(;n>1;)try{return f.stringifyByChunk(r,t,n)}catch(r){n=Math.floor(n/2)}return f.stringifyByChar(r)}function y(r,n){for(var t=0;t<r.length;t++)n[t]=r[t];return n}a.applyFromCharCode=i;var l={};return l.string={string:o,array:function(r){return u(r,new Array(r.length))},arraybuffer:function(r){return l.string.uint8array(r).buffer},uint8array:function(r){return u(r,new Uint8Array(r.length))},nodebuffer:function(n){return u(n,r.alloc(n.length))}},l.array={string:i,array:o,arraybuffer:function(r){return new Uint8Array(r).buffer},uint8array:function(r){return new Uint8Array(r)},nodebuffer:function(n){return r.from(n)}},l.arraybuffer={string:function(r){return i(new Uint8Array(r))},array:function(r){return y(new Uint8Array(r),new Array(r.byteLength))},arraybuffer:o,uint8array:function(r){return new Uint8Array(r)},nodebuffer:function(n){return r.from(new Uint8Array(n))}},l.uint8array={string:i,array:function(r){return y(r,new Array(r.length))},arraybuffer:function(r){return r.buffer},uint8array:o,nodebuffer:function(n){return r.from(n)}},l.nodebuffer={string:i,array:function(r){return y(r,new Array(r.length))},arraybuffer:function(r){return l.nodebuffer.uint8array(r).buffer},uint8array:function(r){return y(r,new Uint8Array(r.length))},nodebuffer:o},a.transformTo=function(r,n){if(n||(n=""),!r)return n;a.checkSupport(r);var t=a.getTypeOf(n);return l[t][r](n)},a.resolve=function(r){for(var n=r.split("/"),t=[],e=0;e<n.length;e++){var a=n[e];"."===a||""===a&&0!==e&&e!==n.length-1||(".."===a?t.pop():t.push(a))}return t.join("/")},a.getTypeOf=n.getTypeOf,a.checkSupport=function(r){if(!n[r.toLowerCase()])throw new Error(r+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(r){var n,t,e="";for(t=0;t<(r||"").length;t++)e+="\\x"+((n=r.charCodeAt(t))<16?"0":"")+n.toString(16).toUpperCase();return e},a.delay=function(r,n,t){setTimeout(function(){r.apply(t||null,n||[])})},a.inherits=function(r,n){var t=function(){};t.prototype=n.prototype,r.prototype=new t},a.extend=function(){var r,n,t={};for(r=0;r<arguments.length;r++)for(n in arguments[r])Object.prototype.hasOwnProperty.call(arguments[r],n)&&void 0===t[n]&&(t[n]=arguments[r][n]);return t},a.prepareContent=function(r,o,f,i,y){return e.Promise.resolve(o).then(function(r){return n.blob&&(r instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(r)))&&"undefined"!=typeof FileReader?new e.Promise(function(n,t){var e=new FileReader;e.onload=function(r){n(r.target.result)},e.onerror=function(r){t(r.target.error)},e.readAsArrayBuffer(r)}):r}).then(function(o){var l,c=a.getTypeOf(o);return c?("arraybuffer"===c?o=a.transformTo("uint8array",o):"string"===c&&(y?o=t.decode(o):f&&!0!==i&&(o=u(l=o,n.uint8array?new Uint8Array(l.length):new Array(l.length)))),o):e.Promise.reject(new Error("Can't read the data of '"+r+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})},a});
//# sourceMappingURL=sourcemaps/utils.js.map