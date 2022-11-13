define([
    "skylark-langx-binary/Buffer",
], function (Buffer) {
    'use strict';
    var support = {};

    support.base64 = true;
    support.array = true;
    support.string = true;
    support.arraybuffer = typeof ArrayBuffer !== 'undefined' && typeof Uint8Array !== 'undefined';
    support.nodebuffer = support.buffer = true;///typeof Buffer !== 'undefined';
    support.uint8array = typeof Uint8Array !== 'undefined';
    if (typeof ArrayBuffer === 'undefined') {
        support.blob = false;
    } else {
        var buffer = new ArrayBuffer(0);
        try {
            support.blob = new Blob([buffer], { type: 'application/zip' }).size === 0;
        } catch (e) {
            try {
                var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
                var builder = new Builder();
                builder.append(buffer);
                support.blob = builder.getBlob('application/zip').size === 0;
            } catch (e) {
                support.blob = false;
            }
        }
    }

    support.getTypeOf = function (input) {
        if (typeof input === 'string') {
            return 'string';
        }
        if (Object.prototype.toString.call(input) === '[object Array]') {
            return 'array';
        }
        if (support.nodebuffer && Buffer.isBuffer(input)) {
            return 'nodebuffer';
        }
        if (support.uint8array && input instanceof Uint8Array) {
            return 'uint8array';
        }
        if (support.arraybuffer && input instanceof ArrayBuffer) {
            return 'arraybuffer';
        }
    };

    return support;
});