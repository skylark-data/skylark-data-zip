/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../utils","./GenericWorker"],function(t,i){"use strict";function e(e){i.call(this,"DataWorker");var s=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,e.then(function(i){s.dataIsReady=!0,s.data=i,s.max=i&&i.length||0,s.type=t.getTypeOf(i),s.isPaused||s._tickAndRepeat()},function(t){s.error(t)})}return t.inherits(e,i),e.prototype.cleanUp=function(){i.prototype.cleanUp.call(this),this.data=null},e.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,t.delay(this._tickAndRepeat,[],this)),!0)},e.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(t.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},e.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var t=null,i=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":t=this.data.substring(this.index,i);break;case"uint8array":t=this.data.subarray(this.index,i);break;case"array":case"nodebuffer":t=this.data.slice(this.index,i)}return this.index=i,this.push({data:t,meta:{percent:this.max?this.index/this.max*100:0}})},e});
//# sourceMappingURL=../sourcemaps/stream/DataWorker.js.map
