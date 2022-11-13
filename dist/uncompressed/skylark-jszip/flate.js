define([
    'skylark-pako',
    './utils',
    './stream/GenericWorker'
], function (pako, utils, GenericWorker) {
    'use strict';

    var USE_TYPEDARRAY = typeof Uint8Array !== 'undefined' && typeof Uint16Array !== 'undefined' && typeof Uint32Array !== 'undefined';

    var ARRAY_TYPE = USE_TYPEDARRAY ? 'uint8array' : 'array';

    var flate = {};

    flate.magic = '\b\0';

    function FlateWorker(action, options) {
        GenericWorker.call(this, 'FlateWorker/' + action);
        this._pako = null;
        this._pakoAction = action;
        this._pakoOptions = options;
        this.meta = {};
    }

    utils.inherits(FlateWorker, GenericWorker);

    FlateWorker.prototype.processChunk = function (chunk) {
        this.meta = chunk.meta;
        if (this._pako === null) {
            this._createPako();
        }
        this._pako.push(utils.transformTo(ARRAY_TYPE, chunk.data), false);
    };
    FlateWorker.prototype.flush = function () {
        GenericWorker.prototype.flush.call(this);
        if (this._pako === null) {
            this._createPako();
        }
        this._pako.push([], true);
    };
    FlateWorker.prototype.cleanUp = function () {
        GenericWorker.prototype.cleanUp.call(this);
        this._pako = null;
    };
    FlateWorker.prototype._createPako = function () {
        this._pako = new pako[this._pakoAction]({
            raw: true,
            level: this._pakoOptions.level || -1
        });
        var self = this;
        this._pako.onData = function (data) {
            self.push({
                data: data,
                meta: self.meta
            });
        };
    };

    flate.compressWorker = function (compressionOptions) {
        return new FlateWorker("Deflate", compressionOptions);
    };
    flate.uncompressWorker = function () {
        return new FlateWorker("Inflate", {});
    };

    return flate;
});