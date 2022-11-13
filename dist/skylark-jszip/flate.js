/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-pako","./utils","./stream/GenericWorker"],function(t,e,o){"use strict";var a="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array?"uint8array":"array",n={};function i(t,e){o.call(this,"FlateWorker/"+t),this._pako=null,this._pakoAction=t,this._pakoOptions=e,this.meta={}}return n.magic="\b\0",e.inherits(i,o),i.prototype.processChunk=function(t){this.meta=t.meta,null===this._pako&&this._createPako(),this._pako.push(e.transformTo(a,t.data),!1)},i.prototype.flush=function(){o.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0)},i.prototype.cleanUp=function(){o.prototype.cleanUp.call(this),this._pako=null},i.prototype._createPako=function(){this._pako=new t[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var e=this;this._pako.onData=function(t){e.push({data:t,meta:e.meta})}},n.compressWorker=function(t){return new i("Deflate",t)},n.uncompressWorker=function(){return new i("Inflate",{})},n});
//# sourceMappingURL=sourcemaps/flate.js.map
