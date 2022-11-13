define([
    "skylark-langx-ns",
    "./JSZip"
], function(skylark, JSZip) {

    var zip = function(data, options) {
        var zip =  new JSZip();
        if (arguments.length>0) {
        	return zip.loadAsync(data, options);
        } else {
        	return zip;
        }
    };

    zip.ZipFile = JSZip

    return skylark.attach("intg.jszip", zip);

});