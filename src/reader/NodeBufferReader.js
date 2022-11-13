define([
    './Uint8ArrayReader',
    '../utils'
], function (Uint8ArrayReader, utils) {
    'use strict';

    function NodeBufferReader(data) {
        Uint8ArrayReader.call(this, data);
    }
    utils.inherits(NodeBufferReader, Uint8ArrayReader);
    NodeBufferReader.prototype.readData = function (size) {
        this.checkOffset(size);
        var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };
    return NodeBufferReader;
});