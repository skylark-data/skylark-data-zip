/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./Uint8ArrayReader","../utils"],function(t,i){"use strict";function e(i){t.call(this,i)}return i.inherits(e,t),e.prototype.readData=function(t){this.checkOffset(t);var i=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,i},e});
//# sourceMappingURL=../sourcemaps/reader/NodeBufferReader.js.map
