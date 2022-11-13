define([
    '../utils',
    './GenericWorker'
], function (utils, GenericWorker) {
    'use strict';

    var DEFAULT_BLOCK_SIZE = 16 * 1024;
    function DataWorker(dataP) {
        GenericWorker.call(this, 'DataWorker');
        var self = this;
        this.dataIsReady = false;
        this.index = 0;
        this.max = 0;
        this.data = null;
        this.type = '';
        this._tickScheduled = false;
        dataP.then(function (data) {
            self.dataIsReady = true;
            self.data = data;
            self.max = data && data.length || 0;
            self.type = utils.getTypeOf(data);
            if (!self.isPaused) {
                self._tickAndRepeat();
            }
        }, function (e) {
            self.error(e);
        });
    }
    utils.inherits(DataWorker, GenericWorker);
    DataWorker.prototype.cleanUp = function () {
        GenericWorker.prototype.cleanUp.call(this);
        this.data = null;
    };
    DataWorker.prototype.resume = function () {
        if (!GenericWorker.prototype.resume.call(this)) {
            return false;
        }
        if (!this._tickScheduled && this.dataIsReady) {
            this._tickScheduled = true;
            utils.delay(this._tickAndRepeat, [], this);
        }
        return true;
    };
    DataWorker.prototype._tickAndRepeat = function () {
        this._tickScheduled = false;
        if (this.isPaused || this.isFinished) {
            return;
        }
        this._tick();
        if (!this.isFinished) {
            utils.delay(this._tickAndRepeat, [], this);
            this._tickScheduled = true;
        }
    };
    DataWorker.prototype._tick = function () {
        if (this.isPaused || this.isFinished) {
            return false;
        }
        var size = DEFAULT_BLOCK_SIZE;
        var data = null, nextIndex = Math.min(this.max, this.index + size);
        if (this.index >= this.max) {
            return this.end();
        } else {
            switch (this.type) {
            case 'string':
                data = this.data.substring(this.index, nextIndex);
                break;
            case 'uint8array':
                data = this.data.subarray(this.index, nextIndex);
                break;
            case 'array':
            case 'nodebuffer':
                data = this.data.slice(this.index, nextIndex);
                break;
            }
            this.index = nextIndex;
            return this.push({
                data: data,
                meta: { percent: this.max ? this.index / this.max * 100 : 0 }
            });
        }
    };
    
    return DataWorker;
});