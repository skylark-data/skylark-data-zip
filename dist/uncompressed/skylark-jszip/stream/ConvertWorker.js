define([
    './GenericWorker',
    '../utils'
], function (GenericWorker, utils) {
    'use strict';

    function ConvertWorker(destType) {
        GenericWorker.call(this, 'ConvertWorker to ' + destType);
        this.destType = destType;
    }
    utils.inherits(ConvertWorker, GenericWorker);
    ConvertWorker.prototype.processChunk = function (chunk) {
        this.push({
            data: utils.transformTo(this.destType, chunk.data),
            meta: chunk.meta
        });
    };

    return ConvertWorker;

});