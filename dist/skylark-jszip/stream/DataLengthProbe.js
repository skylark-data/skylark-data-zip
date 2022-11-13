/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../utils","./GenericWorker"],function(t,e){"use strict";function r(t){e.call(this,"DataLengthProbe for "+t),this.propName=t,this.withStreamInfo(t,0)}return t.inherits(r,e),r.prototype.processChunk=function(t){if(t){var r=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=r+t.data.length}e.prototype.processChunk.call(this,t)},r});
//# sourceMappingURL=../sourcemaps/stream/DataLengthProbe.js.map
