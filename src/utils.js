define([
    'skylark-langx-binary/buffer',
    './support',
    './base64',
    './external',
], function (Buffer,support, base64, external) {
    'use strict';
    var utils = {};

    function string2binary(str) {
        var result = null;
        if (support.uint8array) {
            result = new Uint8Array(str.length);
        } else {
            result = new Array(str.length);
        }
        return stringToArrayLike(str, result);
    }
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
    function identity(input) {
        return input;
    }
    function stringToArrayLike(str, array) {
        for (var i = 0; i < str.length; ++i) {
            array[i] = str.charCodeAt(i) & 255;
        }
        return array;
    }
    var arrayToStringHelper = {
        stringifyByChunk: function (array, type, chunk) {
            var result = [], k = 0, len = array.length;
            if (len <= chunk) {
                return String.fromCharCode.apply(null, array);
            }
            while (k < len) {
                if (type === 'array' || type === 'nodebuffer') {
                    result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
                } else {
                    result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
                }
                k += chunk;
            }
            return result.join('');
        },
        stringifyByChar: function (array) {
            var resultStr = '';
            for (var i = 0; i < array.length; i++) {
                resultStr += String.fromCharCode(array[i]);
            }
            return resultStr;
        },
        applyCanBeUsed: {
            uint8array: function () {
                try {
                    return support.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
                } catch (e) {
                    return false;
                }
            }(),
            nodebuffer: function () {
                try {
                ///    return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.allocBuffer(1)).length === 1;
                    return support.nodebuffer && String.fromCharCode.apply(null, Buffer.alloc(1)).length === 1;
                } catch (e) {
                    return false;
                }
            }()
        }
    };
    function arrayLikeToString(array) {
        var chunk = 65536, type = utils.getTypeOf(array), canUseApply = true;
        if (type === 'uint8array') {
            canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
        } else if (type === 'nodebuffer') {
            canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
        }
        if (canUseApply) {
            while (chunk > 1) {
                try {
                    return arrayToStringHelper.stringifyByChunk(array, type, chunk);
                } catch (e) {
                    chunk = Math.floor(chunk / 2);
                }
            }
        }
        return arrayToStringHelper.stringifyByChar(array);
    }
    utils.applyFromCharCode = arrayLikeToString;
    function arrayLikeToArrayLike(arrayFrom, arrayTo) {
        for (var i = 0; i < arrayFrom.length; i++) {
            arrayTo[i] = arrayFrom[i];
        }
        return arrayTo;
    }
    var transform = {};
    transform['string'] = {
        'string': identity,
        'array': function (input) {
            return stringToArrayLike(input, new Array(input.length));
        },
        'arraybuffer': function (input) {
            return transform['string']['uint8array'](input).buffer;
        },
        'uint8array': function (input) {
            return stringToArrayLike(input, new Uint8Array(input.length));
        },
        'nodebuffer': function (input) {
            ///return stringToArrayLike(input, nodejsUtils.allocBuffer(input.length));
            return stringToArrayLike(input, Buffer.alloc(input.length));
        }
    };
    transform['array'] = {
        'string': arrayLikeToString,
        'array': identity,
        'arraybuffer': function (input) {
            return new Uint8Array(input).buffer;
        },
        'uint8array': function (input) {
            return new Uint8Array(input);
        },
        'nodebuffer': function (input) {
            ///return nodejsUtils.newBufferFrom(input);
            return Buffer.from(input);
        }
    };
    transform['arraybuffer'] = {
        'string': function (input) {
            return arrayLikeToString(new Uint8Array(input));
        },
        'array': function (input) {
            return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
        },
        'arraybuffer': identity,
        'uint8array': function (input) {
            return new Uint8Array(input);
        },
        'nodebuffer': function (input) {
            ///return nodejsUtils.newBufferFrom(new Uint8Array(input));
            return Buffer.from(new Uint8Array(input));
        }
    };
    transform['uint8array'] = {
        'string': arrayLikeToString,
        'array': function (input) {
            return arrayLikeToArrayLike(input, new Array(input.length));
        },
        'arraybuffer': function (input) {
            return input.buffer;
        },
        'uint8array': identity,
        'nodebuffer': function (input) {
            ///return nodejsUtils.newBufferFrom(input);
            return Buffer.from(input);
        }
    };
    transform['nodebuffer'] = {
        'string': arrayLikeToString,
        'array': function (input) {
            return arrayLikeToArrayLike(input, new Array(input.length));
        },
        'arraybuffer': function (input) {
            return transform['nodebuffer']['uint8array'](input).buffer;
        },
        'uint8array': function (input) {
            return arrayLikeToArrayLike(input, new Uint8Array(input.length));
        },
        'nodebuffer': identity
    };
    utils.transformTo = function (outputType, input) {
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