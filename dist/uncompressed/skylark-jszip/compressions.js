define([
    './stream/GenericWorker',
    './flate'
], function (GenericWorker, DEFLATE) {
    'use strict';

    var STORE = {
        magic: '\0\0',
        compressWorker: function () {
            return new GenericWorker('STORE compression');
        },
        uncompressWorker: function () {
            return new GenericWorker('STORE decompression');
        }
    };

    return {
        STORE,
        DEFLATE
    }
});