/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./ArrayReader","../utils"],function(t,i){"use strict";function r(i){t.call(this,i)}return i.inherits(r,t),r.prototype.readData=function(t){if(this.checkOffset(t),0===t)return new Uint8Array(0);var i=this.data.subarray(this.zero+this.index,this.zero+this.index+t);return this.index+=t,i},r});
//# sourceMappingURL=../sourcemaps/reader/Uint8ArrayReader.js.map
