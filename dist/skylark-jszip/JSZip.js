/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./object","./load","./support","./defaults","./external"],function(e,t,n,r,o){"use strict";function i(){if(!(this instanceof i))return new i;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var e=new i;for(var t in this)"function"!=typeof this[t]&&(e[t]=this[t]);return e}}return i.prototype=e,i.prototype.loadAsync=t,i.support=n,i.defaults=r,i.version="3.10.1",i.loadAsync=function(e,t){return(new i).loadAsync(e,t)},i.external=o,i});
//# sourceMappingURL=sourcemaps/JSZip.js.map
