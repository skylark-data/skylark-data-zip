/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./GenericWorker","../utils"],function(t,e){"use strict";function r(e){t.call(this,"ConvertWorker to "+e),this.destType=e}return e.inherits(r,t),r.prototype.processChunk=function(t){this.push({data:e.transformTo(this.destType,t.data),meta:t.meta})},r});
//# sourceMappingURL=../sourcemaps/stream/ConvertWorker.js.map
