/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-binary/Buffer"],function(r){"use strict";var e={base64:!0,array:!0,string:!0};if(e.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,e.nodebuffer=e.buffer=!0,e.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)e.blob=!1;else{var f=new ArrayBuffer(0);try{e.blob=0===new Blob([f],{type:"application/zip"}).size}catch(r){try{var a=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);a.append(f),e.blob=0===a.getBlob("application/zip").size}catch(r){e.blob=!1}}}return e.getTypeOf=function(f){return"string"==typeof f?"string":"[object Array]"===Object.prototype.toString.call(f)?"array":e.nodebuffer&&r.isBuffer(f)?"nodebuffer":e.uint8array&&f instanceof Uint8Array?"uint8array":e.arraybuffer&&f instanceof ArrayBuffer?"arraybuffer":void 0},e});
//# sourceMappingURL=sourcemaps/support.js.map
