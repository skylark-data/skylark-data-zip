/**
 * skylark-utils-zip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0-beta
 * @link www.skylarkjs.org
 * @license MIT
 */
define([
    "skylark-langx/skylark",
    "skylark-langx/langx",
    "./_stuk/jszip"
], function(skylark, langx,JSZip) {

    var zip = function(data, options) {
        var zip =  new JSZip();
        if (arguments.length>0) {
        	return zip.loadAsync(data, options);
        } else {
        	return zip;
        }
    };

    langx.mixin(zip, {
        "ZipFile": JSZip
    });

    return skylark.zip = zip;

});