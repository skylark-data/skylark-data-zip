/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./utils","./external","./utf8","./zipEntries","./stream/Crc32Probe"],function(e,r,n,i,t){"use strict";function o(e){return new r.Promise(function(r,n){var i=e.decompressed.getContentWorker().pipe(new t);i.on("error",function(e){n(e)}).on("end",function(){i.streamInfo.crc32!==e.decompressed.crc32?n(new Error("Corrupted zip : CRC32 mismatch")):r()}).resume()})}return function(t,s){var m=this;return s=e.extend(s||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:n.utf8decode}),e.prepareContent("the loaded zip file",t,!0,s.optimizedBinaryString,s.base64).then(function(e){var r=new i(s);return r.load(e),r}).then(function(e){var n=[r.Promise.resolve(e)],i=e.files;if(s.checkCRC32)for(var t=0;t<i.length;t++)n.push(o(i[t]));return r.Promise.all(n)}).then(function(r){for(var n=r.shift(),i=n.files,t=0;t<i.length;t++){var o=i[t],a=o.fileNameStr,c=e.resolve(o.fileNameStr);m.file(c,o.decompressed,{binary:!0,optimizedBinaryString:!0,date:o.date,dir:o.dir,comment:o.fileCommentStr.length?o.fileCommentStr:null,unixPermissions:o.unixPermissions,dosPermissions:o.dosPermissions,createFolders:s.createFolders}),o.dir||(m.file(c).unsafeOriginalName=a)}return n.zipComment.length&&(m.comment=n.zipComment),m})}});
//# sourceMappingURL=sourcemaps/load.js.map
