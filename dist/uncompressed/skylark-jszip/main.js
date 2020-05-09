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

    return skylark.attach("intg.jszip", zip);

});