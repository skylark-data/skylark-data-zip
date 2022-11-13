define([
    '../utils',
    '../support',
    './ArrayReader',
    './StringReader',
    './NodeBufferReader',
    './Uint8ArrayReader'
], function (utils, support, ArrayReader, StringReader, NodeBufferReader, Uint8ArrayReader) {
    'use strict';

    function readerFor(data) {
        var type = utils.getTypeOf(data);
        utils.checkSupport(type);
        if (type === 'string' && !support.uint8array) {
            return new StringReader(data);
        }
        if (type === 'nodebuffer') {
            return new NodeBufferReader(data);
        }
        if (support.uint8array) {
            return new Uint8ArrayReader(utils.transformTo('uint8array', data));
        }
        return new ArrayReader(utils.transformTo('array', data));
    }

    return readerFor;
});