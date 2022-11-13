/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./external","./stream/DataWorker","./stream/Crc32Probe","./stream/DataLengthProbe"],function(e,r,s,t){"use strict";function o(e,r,s,t,o){this.compressedSize=e,this.uncompressedSize=r,this.crc32=s,this.compression=t,this.compressedContent=o}return o.prototype={getContentWorker:function(){var s=new r(e.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new t("data_length")),o=this;return s.on("end",function(){if(this.streamInfo.data_length!==o.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),s},getCompressedWorker:function(){return new r(e.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},o.createWorkerFrom=function(e,r,o){return e.pipe(new s).pipe(new t("uncompressedSize")).pipe(r.compressWorker(o)).pipe(new t("compressedSize")).withStreamInfo("compression",r)},o});
//# sourceMappingURL=sourcemaps/compressedObject.js.map
