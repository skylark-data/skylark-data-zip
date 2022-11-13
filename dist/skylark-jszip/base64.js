/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./support"],function(r){"use strict";var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";return{encode:function(a){for(var e,n,h,c,i,o,A,d=[],l=0,u=a.length,f=u,g="string"!==r.getTypeOf(a);l<a.length;)f=u-l,g?(e=a[l++],n=l<u?a[l++]:0,h=l<u?a[l++]:0):(e=a.charCodeAt(l++),n=l<u?a.charCodeAt(l++):0,h=l<u?a.charCodeAt(l++):0),c=e>>2,i=(3&e)<<4|n>>4,o=f>1?(15&n)<<2|h>>6:64,A=f>2?63&h:64,d.push(t.charAt(c)+t.charAt(i)+t.charAt(o)+t.charAt(A));return d.join("")},decode:function(a){var e,n,h,c,i,o,A=0,d=0;if("data:"===a.substr(0,"data:".length))throw new Error("Invalid base64 input, it looks like a data url.");var l,u=3*(a=a.replace(/[^A-Za-z0-9+/=]/g,"")).length/4;if(a.charAt(a.length-1)===t.charAt(64)&&u--,a.charAt(a.length-2)===t.charAt(64)&&u--,u%1!=0)throw new Error("Invalid base64 input, bad content length.");for(l=r.uint8array?new Uint8Array(0|u):new Array(0|u);A<a.length;)e=t.indexOf(a.charAt(A++))<<2|(c=t.indexOf(a.charAt(A++)))>>4,n=(15&c)<<4|(i=t.indexOf(a.charAt(A++)))>>2,h=(3&i)<<6|(o=t.indexOf(a.charAt(A++))),l[d++]=e,64!==i&&(l[d++]=n),64!==o&&(l[d++]=h);return l}}});
//# sourceMappingURL=sourcemaps/base64.js.map
