define([
    'skylark-langx-binary/buffer',
    'skylark-langx-binary/transform',
    'skylark-langx-binary/arraylike-to-string',
    "skylark-langx-constructs",
    './support',
    './base64',
    './external',
], function (Buffer,transform,arrayLikeToString,constructs,support, base64, external) {
    'use strict';
    var utils = {};


    utils.newBlob = function (part, type) {
        utils.checkSupport('blob');
        try {
            return new Blob([part], { type: type });
        } catch (e) {
            try {
                var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
                var builder = new Builder();
                builder.append(part);
                return builder.getBlob(type);
            } catch (e) {
                throw new Error("Bug : can't construct the Blob.");
            }
        }
    };

    utils.applyFromCharCode = arrayLikeToString;

    utils.transformTo = function (outputType, input) {
        /*
        if (!input) {
            input = '';
        }
        if (!outputType) {
            return input;
        }
        utils.checkSupport(outputType);
        var inputType = utils.getTypeOf(input);
        var result = transform[inputType][outputType](input);
        return result;
        */
        if (outputType=="nodebuffer") {
            outputType = "memory";
        }
        return transform(outputType,input);
    };
    utils.resolve = function (path) {
        var parts = path.split('/');
        var result = [];
        for (var index = 0; index < parts.length; index++) {
            var part = parts[index];
            if (part === '.' || part === '' && index !== 0 && index !== parts.length - 1) {
                continue;
            } else if (part === '..') {
                result.pop();
            } else {
                result.push(part);
            }
        }
        return result.join('/');
    };
    /*
    utils.getTypeOf = function (input) {
        if (typeof input === 'string') {
            return 'string';
        }
        if (Object.prototype.toString.call(input) === '[object Array]') {
            return 'array';
        }
        if (support.nodebuffer && Buffer.isBuffer(input)) {
            return 'nodebuffer';
        }
        if (support.uint8array && input instanceof Uint8Array) {
            return 'uint8array';
        }
        if (support.arraybuffer && input instanceof ArrayBuffer) {
            return 'arraybuffer';
        }
    };
    */
    utils.getTypeOf = support.getTypeOf;
    
    utils.checkSupport = function (type) {
        var supported = support[type.toLowerCase()];
        if (!supported) {
            throw new Error(type + ' is not supported by this platform');
        }
    };
    utils.MAX_VALUE_16BITS = 65535;
    utils.MAX_VALUE_32BITS = -1;
    utils.pretty = function (str) {
        var res = '', code, i;
        for (i = 0; i < (str || '').length; i++) {
            code = str.charCodeAt(i);
            res += '\\x' + (code < 16 ? '0' : '') + code.toString(16).toUpperCase();
        }
        return res;
    };
    utils.delay = function (callback, args, self) {
        setTimeout(function () {
            callback.apply(self || null, args || []);
        });
    };
    utils.inherits = function (ctor, superCtor) {
        var Obj = function () {
        };
        Obj.prototype = superCtor.prototype;
        ctor.prototype = new Obj();
    };
    utils.extend = function () {
        var result = {}, i, attr;
        for (i = 0; i < arguments.length; i++) {
            for (attr in arguments[i]) {
                if (Object.prototype.hasOwnProperty.call(arguments[i], attr) && typeof result[attr] === 'undefined') {
                    result[attr] = arguments[i][attr];
                }
            }
        }
        return result;
    };
    utils.prepareContent = function (name, inputData, isBinary, isOptimizedBinaryString, isBase64) {
        var promise = external.Promise.resolve(inputData).then(function (data) {
            var isBlob = support.blob && (data instanceof Blob || [
                '[object File]',
                '[object Blob]'
            ].indexOf(Object.prototype.toString.call(data)) !== -1);
            if (isBlob && typeof FileReader !== 'undefined') {
                return new external.Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        resolve(e.target.result);
                    };
                    reader.onerror = function (e) {
                        reject(e.target.error);
                    };
                    reader.readAsArrayBuffer(data);
                });
            } else {
                return data;
            }
        });
        return promise.then(function (data) {
            var dataType = utils.getTypeOf(data);
            if (!dataType) {
                return external.Promise.reject(new Error("Can't read the data of '" + name + "'. Is it " + 'in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?'));
            }
            if (dataType === 'arraybuffer') {
                data = utils.transformTo('uint8array', data);
            } else if (dataType === 'string') {
                if (isBase64) {
                    data = base64.decode(data);
                } else if (isBinary) {
                    if (isOptimizedBinaryString !== true) {
                        data = string2binary(data);
                    }
                }
            }
            return data;
        });
    };

    return utils;
});