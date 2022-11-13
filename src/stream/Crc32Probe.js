define([
    './GenericWorker',
    '../crc32',
    '../utils'
], function (GenericWorker, crc32, utils) {
    'use strict';

    function Crc32Probe() {
        GenericWorker.call(this, 'Crc32Probe');
        this.withStreamInfo('crc32', 0);
    }
    utils.inherits(Crc32Probe, GenericWorker);
    Crc32Probe.prototype.processChunk = function (chunk) {
        this.streamInfo.crc32 = crc32(chunk.data, this.streamInfo.crc32 || 0);
        this.push(chunk);
    };
    
    return Crc32Probe;

});