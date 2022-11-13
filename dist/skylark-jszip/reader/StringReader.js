/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./DataReader","../utils"],function(t,e){"use strict";function i(e){t.call(this,e)}return e.inherits(i,t),i.prototype.byteAt=function(t){return this.data.charCodeAt(this.zero+t)},i.prototype.lastIndexOfSignature=function(t){return this.data.lastIndexOf(t)-this.zero},i.prototype.readAndCheckSignature=function(t){return t===this.readData(4)},i.prototype.readData=function(t){this.checkOffset(t);var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},i});
//# sourceMappingURL=../sourcemaps/reader/StringReader.js.map
