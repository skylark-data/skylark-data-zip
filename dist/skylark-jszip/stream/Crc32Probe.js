/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./GenericWorker","../crc32","../utils"],function(t,r,c){"use strict";function i(){t.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}return c.inherits(i,t),i.prototype.processChunk=function(t){this.streamInfo.crc32=r(t.data,this.streamInfo.crc32||0),this.push(t)},i});
//# sourceMappingURL=../sourcemaps/stream/Crc32Probe.js.map
