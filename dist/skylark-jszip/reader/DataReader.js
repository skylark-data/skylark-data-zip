/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../utils"],function(t){"use strict";function n(t){this.data=t,this.length=t.length,this.index=0,this.zero=0}return n.prototype={checkOffset:function(t){this.checkIndex(this.index+t)},checkIndex:function(t){if(this.length<this.zero+t||t<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+t+"). Corrupted zip ?")},setIndex:function(t){this.checkIndex(t),this.index=t},skip:function(t){this.setIndex(this.index+t)},byteAt:function(){},readInt:function(t){var n,e=0;for(this.checkOffset(t),n=this.index+t-1;n>=this.index;n--)e=(e<<8)+this.byteAt(n);return this.index+=t,e},readString:function(n){return t.transformTo("string",this.readData(n))},readData:function(){},lastIndexOfSignature:function(){},readAndCheckSignature:function(){},readDate:function(){var t=this.readInt(4);return new Date(Date.UTC(1980+(t>>25&127),(t>>21&15)-1,t>>16&31,t>>11&31,t>>5&63,(31&t)<<1))}},n});
//# sourceMappingURL=../sourcemaps/reader/DataReader.js.map
