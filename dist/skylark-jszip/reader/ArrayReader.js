/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./DataReader","../utils"],function(t,e){"use strict";function r(e){t.call(this,e);for(var r=0;r<this.data.length;r++)e[r]=255&e[r]}return e.inherits(r,t),r.prototype.byteAt=function(t){return this.data[this.zero+t]},r.prototype.lastIndexOfSignature=function(t){for(var e=t.charCodeAt(0),r=t.charCodeAt(1),a=t.charCodeAt(2),i=t.charCodeAt(3),h=this.length-4;h>=0;--h)if(this.data[h]===e&&this.data[h+1]===r&&this.data[h+2]===a&&this.data[h+3]===i)return h-this.zero;return-1},r.prototype.readAndCheckSignature=function(t){var e=t.charCodeAt(0),r=t.charCodeAt(1),a=t.charCodeAt(2),i=t.charCodeAt(3),h=this.readData(4);return e===h[0]&&r===h[1]&&a===h[2]&&i===h[3]},r.prototype.readData=function(t){if(this.checkOffset(t),0===t)return[];var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},r});
//# sourceMappingURL=../sourcemaps/reader/ArrayReader.js.map
