define([
    '../utils',
    './ConvertWorker',
    './GenericWorker',
    '../base64',
    '../support',
    '../external'
], function (utils, ConvertWorker, GenericWorker, base64, support, external) {
    'use strict';

    ///if (support.nodestream) {
    ///    try {
    ///        NodejsStreamOutputAdapter = __module__6;
    ///    } catch (e) {
    ///    }
    ///}
    function transformZipOutput(type, content, mimeType) {
        switch (type) {
        case 'blob':
            return utils.newBlob(utils.transformTo('arraybuffer', content), mimeType);
        case 'base64':
            return base64.encode(content);
        default:
            return utils.transformTo(type, content);
        }
    }
    function concat(type, dataArray) {
        var i, index = 0, res = null, totalLength = 0;
        for (i = 0; i < dataArray.length; i++) {
            totalLength += dataArray[i].length;
        }
        switch (type) {
        case 'string':
            return dataArray.join('');
        case 'array':
            return Array.prototype.concat.apply([], dataArray);
        case 'uint8array':
            res = new Uint8Array(totalLength);
            for (i = 0; i < dataArray.length; i++) {
                res.set(dataArray[i], index);
                index += dataArray[i].length;
            }
            return res;
        case 'nodebuffer':
            return Buffer.concat(dataArray);
        default:
            throw new Error("concat : unsupported type '" + type + "'");
        }
    }
    function accumulate(helper, updateCallback) {
        return new external.Promise(function (resolve, reject) {
            var dataArray = [];
            var chunkType = helper._internalType, resultType = helper._outputType, mimeType = helper._mimeType;
            helper.on('data', function (data, meta) {
                dataArray.push(data);
                if (updateCallback) {
                    updateCallback(meta);
                }
            }).on('error', function (err) {
                dataArray = [];
                reject(err);
            }).on('end', function () {
                try {
                    var result = transformZipOutput(resultType, concat(chunkType, dataArray), mimeType);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
                dataArray = [];
            }).resume();
        });
    }
    function StreamHelper(worker, outputType, mimeType) {
        var internalType = outputType;
        switch (outputType) {
        case 'blob':
        case 'arraybuffer':
            internalType = 'uint8array';
            break;
        case 'base64':
            internalType = 'string';
            break;
        }
        try {
            this._internalType = internalType;
            this._outputType = outputType;
            this._mimeType = mimeType;
            utils.checkSupport(internalType);
            this._worker = worker.pipe(new ConvertWorker(internalType));
            worker.lock();
        } catch (e) {
            this._worker = new GenericWorker('error');
            this._worker.error(e);
        }
    }
    StreamHelper.prototype = {
        accumulate: function (updateCb) {
            return accumulate(this, updateCb);
        },
        on: function (evt, fn) {
            var self = this;
            if (evt === 'data') {
                this._worker.on(evt, function (chunk) {
                    fn.call(self, chunk.data, chunk.meta);
                });
            } else {
                this._worker.on(evt, function () {
                    utils.delay(fn, arguments, self);
                });
            }
            return this;
        },
        resume: function () {
            utils.delay(this._worker.resume, [], this._worker);
            return this;
        },
        pause: function () {
            this._worker.pause();
            return this;
        },
        toNodejsStream: function (updateCb) {
            utils.checkSupport('nodestream');
            if (this._outputType !== 'nodebuffer') {
                throw new Error(this._outputType + ' is not supported by this method');
            }
            return new NodejsStreamOutputAdapter(this, { objectMode: this._outputType !== 'nodebuffer' }, updateCb);
        }
    };
   
    return StreamHelper;
});