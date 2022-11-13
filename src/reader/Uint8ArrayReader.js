define([
    './ArrayReader',
    '../utils'
], function (ArrayReader, utils) {
    'use strict';

    function Uint8ArrayReader(data) {
        ArrayReader.call(this, data);
    }
    utils.inherits(Uint8ArrayReader, ArrayReader);
    Uint8ArrayReader.prototype.readData = function (size) {
        this.checkOffset(size);
        if (size === 0) {
            return new Uint8Array(0);
        }
        var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };
    return Uint8ArrayReader;

});