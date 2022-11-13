/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./compressions","./generate/ZipFileWorker"],function(e,o){"use strict";var r=function(o,r){var i=o||r,n=e[i];if(!n)throw new Error(i+" is not a valid compression method !");return n};return function(e,i,n){var s=new o(i.streamFiles,n,i.platform,i.encodeFileName),t=0;try{e.forEach(function(e,o){t++;var n=r(o.options.compression,i.compression),m=o.options.compressionOptions||i.compressionOptions||{},c=o.dir,a=o.date;o._compressWorker(n,m).withStreamInfo("file",{name:e,dir:c,date:a,comment:o.comment||"",unixPermissions:o.unixPermissions,dosPermissions:o.dosPermissions}).pipe(s)}),s.entriesCount=t}catch(e){s.error(e)}return s}});
//# sourceMappingURL=sourcemaps/generate.js.map
