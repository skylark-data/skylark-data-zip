define([
    '../utils',
    './GenericWorker'
], function (utils, GenericWorker) {
    'use strict';

    function DataLengthProbe(propName) {
        GenericWorker.call(this, 'DataLengthProbe for ' + propName);
        this.propName = propName;
        this.withStreamInfo(propName, 0);
    }
    utils.inherits(DataLengthProbe, GenericWorker);
    DataLengthProbe.prototype.processChunk = function (chunk) {
        if (chunk) {
            var length = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = length + chunk.data.length;
        }
        GenericWorker.prototype.processChunk.call(this, chunk);
    };
    return DataLengthProbe;

});