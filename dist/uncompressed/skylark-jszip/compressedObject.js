define([
    './external',
    './stream/DataWorker',
    './stream/Crc32Probe',
    './stream/DataLengthProbe'
], function (external, DataWorker, Crc32Probe, DataLengthProbe) {
    'use strict';

    function CompressedObject(compressedSize, uncompressedSize, crc32, compression, data) {
        this.compressedSize = compressedSize;
        this.uncompressedSize = uncompressedSize;
        this.crc32 = crc32;
        this.compression = compression;
        this.compressedContent = data;
    }
    CompressedObject.prototype = {
        getContentWorker: function () {
            var worker = new DataWorker(external.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new DataLengthProbe('data_length'));
            var that = this;
            worker.on('end', function () {
                if (this.streamInfo['data_length'] !== that.uncompressedSize) {
                    throw new Error('Bug : uncompressed data size mismatch');
                }
            });
            return worker;
        },
        getCompressedWorker: function () {
            return new DataWorker(external.Promise.resolve(this.compressedContent)).withStreamInfo('compressedSize', this.compressedSize).withStreamInfo('uncompressedSize', this.uncompressedSize).withStreamInfo('crc32', this.crc32).withStreamInfo('compression', this.compression);
        }
    };
    CompressedObject.createWorkerFrom = function (uncompressedWorker, compression, compressionOptions) {
        return uncompressedWorker.pipe(new Crc32Probe()).pipe(new DataLengthProbe('uncompressedSize')).pipe(compression.compressWorker(compressionOptions)).pipe(new DataLengthProbe('compressedSize')).withStreamInfo('compression', compression);
    };
    
    return CompressedObject;

});