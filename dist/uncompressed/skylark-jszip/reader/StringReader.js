define([
    './DataReader',
    '../utils'
], function (DataReader, utils) {
    'use strict';

    function StringReader(data) {
        DataReader.call(this, data);
    }
    utils.inherits(StringReader, DataReader);
    StringReader.prototype.byteAt = function (i) {
        return this.data.charCodeAt(this.zero + i);
    };
    StringReader.prototype.lastIndexOfSignature = function (sig) {
        return this.data.lastIndexOf(sig) - this.zero;
    };
    StringReader.prototype.readAndCheckSignature = function (sig) {
        var data = this.readData(4);
        return sig === data;
    };
    StringReader.prototype.readData = function (size) {
        this.checkOffset(size);
        var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };
    
    return StringReader;
});