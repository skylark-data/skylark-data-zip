/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./utils"],function(r){"use strict";var n=function(){for(var r,n=[],t=0;t<256;t++){r=t;for(var e=0;e<8;e++)r=1&r?3988292384^r>>>1:r>>>1;n[t]=r}return n}();return function(t,e){return void 0!==t&&t.length?"string"!==r.getTypeOf(t)?function(r,t,e,u){var f=n,o=u+e;r^=-1;for(var i=u;i<o;i++)r=r>>>8^f[255&(r^t[i])];return-1^r}(0|e,t,t.length,0):function(r,t,e,u){var f=n,o=u+e;r^=-1;for(var i=u;i<o;i++)r=r>>>8^f[255&(r^t.charCodeAt(i))];return-1^r}(0|e,t,t.length,0):0}});
//# sourceMappingURL=sourcemaps/crc32.js.map
