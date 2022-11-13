/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./stream/GenericWorker","./flate"],function(e,r){"use strict";return{STORE:{magic:"\0\0",compressWorker:function(){return new e("STORE compression")},uncompressWorker:function(){return new e("STORE decompression")}},DEFLATE:r}});
//# sourceMappingURL=sourcemaps/compressions.js.map
