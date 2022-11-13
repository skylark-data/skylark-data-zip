/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../utils","../support","./ArrayReader","./StringReader","./NodeBufferReader","./Uint8ArrayReader"],function(r,e,n,t,a,u){"use strict";return function(i){var f=r.getTypeOf(i);return r.checkSupport(f),"string"!==f||e.uint8array?"nodebuffer"===f?new a(i):e.uint8array?new u(r.transformTo("uint8array",i)):new n(r.transformTo("array",i)):new t(i)}});
//# sourceMappingURL=../sourcemaps/reader/readerFor.js.map
