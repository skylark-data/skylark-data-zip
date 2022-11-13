define([
    './stream/StreamHelper',
    './stream/DataWorker',
    './utf8',
    './compressedObject',
    './stream/GenericWorker'
], function (StreamHelper, DataWorker, utf8, CompressedObject, GenericWorker) {
    'use strict';

    var ZipObject = function (name, data, options) {
        this.name = name;
        this.dir = options.dir;
        this.date = options.date;
        this.comment = options.comment;
        this.unixPermissions = options.unixPermissions;
        this.dosPermissions = options.dosPermissions;
        this._data = data;
        this._dataBinary = options.binary;
        this.options = {
            compression: options.compression,
            compressionOptions: options.compressionOptions
        };
    };
    ZipObject.prototype = {
        internalStream: function (type) {
            var result = null, outputType = 'string';
            try {
                if (!type) {
                    throw new Error('No output type specified.');
                }
                outputType = type.toLowerCase();
                var askUnicodeString = outputType === 'string' || outputType === 'text';
                if (outputType === 'binarystring' || outputType === 'text') {
                    outputType = 'string';
                }
                result = this._decompressWorker();
                var isUnicodeString = !this._dataBinary;
                if (isUnicodeString && !askUnicodeString) {
                    result = result.pipe(new utf8.Utf8EncodeWorker());
                }
                if (!isUnicodeString && askUnicodeString) {
                    result = result.pipe(new utf8.Utf8DecodeWorker());
                }
            } catch (e) {
                result = new GenericWorker('error');
                result.error(e);
            }
            return new StreamHelper(result, outputType, '');
        },
        async: function (type, onUpdate) {
            return this.internalStream(type).accumulate(onUpdate);
        },
        nodeStream: function (type, onUpdate) {
            return this.internalStream(type || 'nodebuffer').toNodejsStream(onUpdate);
        },
        _compressWorker: function (compression, compressionOptions) {
            if (this._data instanceof CompressedObject && this._data.compression.magic === compression.magic) {
                return this._data.getCompressedWorker();
            } else {
                var result = this._decompressWorker();
                if (!this._dataBinary) {
                    result = result.pipe(new utf8.Utf8EncodeWorker());
                }
                return CompressedObject.createWorkerFrom(result, compression, compressionOptions);
            }
        },
        _decompressWorker: function () {
            if (this._data instanceof CompressedObject) {
                return this._data.getContentWorker();
            } else if (this._data instanceof GenericWorker) {
                return this._data;
            } else {
                return new DataWorker(this._data);
            }
        }
    };
    var removedMethods = [
        'asText',
        'asBinary',
        'asNodeBuffer',
        'asUint8Array',
        'asArrayBuffer'
    ];
    var removedFn = function () {
        throw new Error('This method has been removed in JSZip 3.0, please check the upgrade guide.');
    };
    for (var i = 0; i < removedMethods.length; i++) {
        ZipObject.prototype[removedMethods[i]] = removedFn;
    }
    return ZipObject;

});