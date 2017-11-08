/**
 * skylark-utils-zip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0-beta
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx/skylark","skylark-langx/langx","./_stuk/jszip"],function(n,a,i){var l=function(n,a){var l=new i;return arguments.length>0?l.loadAsync(n,a):l};return a.mixin(l,{ZipFile:i}),n.zip=l});
//# sourceMappingURL=sourcemaps/zip.js.map
