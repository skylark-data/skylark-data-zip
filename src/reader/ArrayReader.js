define([
    './DataReader',
    '../utils'
], function (DataReader, utils) {
    'use strict';

    function ArrayReader(data) {
        DataReader.call(this, data);
        for (var i = 0; i < this.data.length; i++) {
            data[i] = data[i] & 255;
        }
    }
    utils.inherits(ArrayReader, DataReader);
    ArrayReader.prototype.byteAt = function (i) {
        return this.data[this.zero + i];
    };
    ArrayReader.prototype.lastIndexOfSignature = function (sig) {
        var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3);
        for (var i = this.length - 4; i >= 0; --i) {
            if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
                return i - this.zero;
            }
        }
        return -1;
    };
    ArrayReader.prototype.readAndCheckSignature = function (sig) {
        var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3), data = this.readData(4);
        return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
    };
    ArrayReader.prototype.readData = function (size) {
        this.checkOffset(size);
        if (size === 0) {
            return [];
        }
        var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };


    return ArrayReader;

});