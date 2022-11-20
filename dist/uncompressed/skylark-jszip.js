/**
 * skylark-jszip - A skylark wrapper for jszip.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-langx-binary/Buffer',[
  "./memory"
],function(Memory){
  return Memory;
});
define('skylark-jszip/support',[
    "skylark-langx-binary/Buffer",
], function (Buffer) {
    'use strict';
    var support = {};

    support.base64 = true;
    support.array = true;
    support.string = true;
    support.arraybuffer = typeof ArrayBuffer !== 'undefined' && typeof Uint8Array !== 'undefined';
    support.nodebuffer = support.buffer = true;///typeof Buffer !== 'undefined';
    support.uint8array = typeof Uint8Array !== 'undefined';
    if (typeof ArrayBuffer === 'undefined') {
        support.blob = false;
    } else {
        var buffer = new ArrayBuffer(0);
        try {
            support.blob = new Blob([buffer], { type: 'application/zip' }).size === 0;
        } catch (e) {
            try {
                var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
                var builder = new Builder();
                builder.append(buffer);
                support.blob = builder.getBlob('application/zip').size === 0;
            } catch (e) {
                support.blob = false;
            }
        }
    }

    support.getTypeOf = function (input) {
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

    return support;
});
define('skylark-jszip/base64',[
    './support'
], function (support) {
    'use strict';

    var _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    function encode(input) {
        var output = [];
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0, len = input.length, remainingBytes = len;
        var isArray = support.getTypeOf(input) !== 'string';
        while (i < input.length) {
            remainingBytes = len - i;
            if (!isArray) {
                chr1 = input.charCodeAt(i++);
                chr2 = i < len ? input.charCodeAt(i++) : 0;
                chr3 = i < len ? input.charCodeAt(i++) : 0;
            } else {
                chr1 = input[i++];
                chr2 = i < len ? input[i++] : 0;
                chr3 = i < len ? input[i++] : 0;
            }
            enc1 = chr1 >> 2;
            enc2 = (chr1 & 3) << 4 | chr2 >> 4;
            enc3 = remainingBytes > 1 ? (chr2 & 15) << 2 | chr3 >> 6 : 64;
            enc4 = remainingBytes > 2 ? chr3 & 63 : 64;
            output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));
        }
        return output.join('');
    };
    function decode(input) {
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0, resultIndex = 0;
        var dataUrlPrefix = 'data:';
        if (input.substr(0, dataUrlPrefix.length) === dataUrlPrefix) {
            throw new Error('Invalid base64 input, it looks like a data url.');
        }
        input = input.replace(/[^A-Za-z0-9+/=]/g, '');
        var totalLength = input.length * 3 / 4;
        if (input.charAt(input.length - 1) === _keyStr.charAt(64)) {
            totalLength--;
        }
        if (input.charAt(input.length - 2) === _keyStr.charAt(64)) {
            totalLength--;
        }
        if (totalLength % 1 !== 0) {
            throw new Error('Invalid base64 input, bad content length.');
        }
        var output;
        if (support.uint8array) {
            output = new Uint8Array(totalLength | 0);
        } else {
            output = new Array(totalLength | 0);
        }
        while (i < input.length) {
            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));
            chr1 = enc1 << 2 | enc2 >> 4;
            chr2 = (enc2 & 15) << 4 | enc3 >> 2;
            chr3 = (enc3 & 3) << 6 | enc4;
            output[resultIndex++] = chr1;
            if (enc3 !== 64) {
                output[resultIndex++] = chr2;
            }
            if (enc4 !== 64) {
                output[resultIndex++] = chr3;
            }
        }
        return output;
    };

    return {
        encode,
        decode
    }
});
define('skylark-jszip/external',[],function () {
    'use strict';

    return  { Promise};
});
define('skylark-jszip/utils',[
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
define('skylark-jszip/stream/GenericWorker',[], function () {
    'use strict';

    function GenericWorker(name) {
        this.name = name || 'default';
        this.streamInfo = {};
        this.generatedError = null;
        this.extraStreamInfo = {};
        this.isPaused = true;
        this.isFinished = false;
        this.isLocked = false;
        this._listeners = {
            'data': [],
            'end': [],
            'error': []
        };
        this.previous = null;
    }
    GenericWorker.prototype = {
        push: function (chunk) {
            this.emit('data', chunk);
        },
        end: function () {
            if (this.isFinished) {
                return false;
            }
            this.flush();
            try {
                this.emit('end');
                this.cleanUp();
                this.isFinished = true;
            } catch (e) {
                this.emit('error', e);
            }
            return true;
        },
        error: function (e) {
            if (this.isFinished) {
                return false;
            }
            if (this.isPaused) {
                this.generatedError = e;
            } else {
                this.isFinished = true;
                this.emit('error', e);
                if (this.previous) {
                    this.previous.error(e);
                }
                this.cleanUp();
            }
            return true;
        },
        on: function (name, listener) {
            this._listeners[name].push(listener);
            return this;
        },
        cleanUp: function () {
            this.streamInfo = this.generatedError = this.extraStreamInfo = null;
            this._listeners = [];
        },
        emit: function (name, arg) {
            if (this._listeners[name]) {
                for (var i = 0; i < this._listeners[name].length; i++) {
                    this._listeners[name][i].call(this, arg);
                }
            }
        },
        pipe: function (next) {
            return next.registerPrevious(this);
        },
        registerPrevious: function (previous) {
            if (this.isLocked) {
                throw new Error("The stream '" + this + "' has already been used.");
            }
            this.streamInfo = previous.streamInfo;
            this.mergeStreamInfo();
            this.previous = previous;
            var self = this;
            previous.on('data', function (chunk) {
                self.processChunk(chunk);
            });
            previous.on('end', function () {
                self.end();
            });
            previous.on('error', function (e) {
                self.error(e);
            });
            return this;
        },
        pause: function () {
            if (this.isPaused || this.isFinished) {
                return false;
            }
            this.isPaused = true;
            if (this.previous) {
                this.previous.pause();
            }
            return true;
        },
        resume: function () {
            if (!this.isPaused || this.isFinished) {
                return false;
            }
            this.isPaused = false;
            var withError = false;
            if (this.generatedError) {
                this.error(this.generatedError);
                withError = true;
            }
            if (this.previous) {
                this.previous.resume();
            }
            return !withError;
        },
        flush: function () {
        },
        processChunk: function (chunk) {
            this.push(chunk);
        },
        withStreamInfo: function (key, value) {
            this.extraStreamInfo[key] = value;
            this.mergeStreamInfo();
            return this;
        },
        mergeStreamInfo: function () {
            for (var key in this.extraStreamInfo) {
                if (!Object.prototype.hasOwnProperty.call(this.extraStreamInfo, key)) {
                    continue;
                }
                this.streamInfo[key] = this.extraStreamInfo[key];
            }
        },
        lock: function () {
            if (this.isLocked) {
                throw new Error("The stream '" + this + "' has already been used.");
            }
            this.isLocked = true;
            if (this.previous) {
                this.previous.lock();
            }
        },
        toString: function () {
            var me = 'Worker ' + this.name;
            if (this.previous) {
                return this.previous + ' -> ' + me;
            } else {
                return me;
            }
        }
    };

    return GenericWorker;

});
define('skylark-jszip/utf8',[
    'skylark-langx-binary/buffer',
    './utils',
    './support',
    './stream/GenericWorker'
], function (Buffer,utils, support,  GenericWorker) {
    'use strict';
    var utf8 = {};

    var _utf8len = new Array(256);
    for (var i = 0; i < 256; i++) {
        _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
    }
    _utf8len[254] = _utf8len[254] = 1;
    var string2buf = function (str) {
        var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
        for (m_pos = 0; m_pos < str_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
                c2 = str.charCodeAt(m_pos + 1);
                if ((c2 & 64512) === 56320) {
                    c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                    m_pos++;
                }
            }
            buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
        }
        if (support.uint8array) {
            buf = new Uint8Array(buf_len);
        } else {
            buf = new Array(buf_len);
        }
        for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
                c2 = str.charCodeAt(m_pos + 1);
                if ((c2 & 64512) === 56320) {
                    c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                    m_pos++;
                }
            }
            if (c < 128) {
                buf[i++] = c;
            } else if (c < 2048) {
                buf[i++] = 192 | c >>> 6;
                buf[i++] = 128 | c & 63;
            } else if (c < 65536) {
                buf[i++] = 224 | c >>> 12;
                buf[i++] = 128 | c >>> 6 & 63;
                buf[i++] = 128 | c & 63;
            } else {
                buf[i++] = 240 | c >>> 18;
                buf[i++] = 128 | c >>> 12 & 63;
                buf[i++] = 128 | c >>> 6 & 63;
                buf[i++] = 128 | c & 63;
            }
        }
        return buf;
    };
    var utf8border = function (buf, max) {
        var pos;
        max = max || buf.length;
        if (max > buf.length) {
            max = buf.length;
        }
        pos = max - 1;
        while (pos >= 0 && (buf[pos] & 192) === 128) {
            pos--;
        }
        if (pos < 0) {
            return max;
        }
        if (pos === 0) {
            return max;
        }
        return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
    var buf2string = function (buf) {
        var i, out, c, c_len;
        var len = buf.length;
        var utf16buf = new Array(len * 2);
        for (out = 0, i = 0; i < len;) {
            c = buf[i++];
            if (c < 128) {
                utf16buf[out++] = c;
                continue;
            }
            c_len = _utf8len[c];
            if (c_len > 4) {
                utf16buf[out++] = 65533;
                i += c_len - 1;
                continue;
            }
            c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
            while (c_len > 1 && i < len) {
                c = c << 6 | buf[i++] & 63;
                c_len--;
            }
            if (c_len > 1) {
                utf16buf[out++] = 65533;
                continue;
            }
            if (c < 65536) {
                utf16buf[out++] = c;
            } else {
                c -= 65536;
                utf16buf[out++] = 55296 | c >> 10 & 1023;
                utf16buf[out++] = 56320 | c & 1023;
            }
        }
        if (utf16buf.length !== out) {
            if (utf16buf.subarray) {
                utf16buf = utf16buf.subarray(0, out);
            } else {
                utf16buf.length = out;
            }
        }
        return utils.applyFromCharCode(utf16buf);
    };
    utf8.utf8encode = function utf8encode(str) {
        if (support.nodebuffer) {
            ///return nodejsUtils.newBufferFrom(str, 'utf-8');
            return Buffer.from(str,'utf-8');
        }
        return string2buf(str);
    };
    utf8.utf8decode = function utf8decode(buf) {
        if (support.nodebuffer) {
            return utils.transformTo('nodebuffer', buf).toString('utf-8');
        }
        buf = utils.transformTo(support.uint8array ? 'uint8array' : 'array', buf);
        return buf2string(buf);
    };
    function Utf8DecodeWorker() {
        GenericWorker.call(this, 'utf-8 decode');
        this.leftOver = null;
    }
    utils.inherits(Utf8DecodeWorker, GenericWorker);
    Utf8DecodeWorker.prototype.processChunk = function (chunk) {
        var data = utils.transformTo(support.uint8array ? 'uint8array' : 'array', chunk.data);
        if (this.leftOver && this.leftOver.length) {
            if (support.uint8array) {
                var previousData = data;
                data = new Uint8Array(previousData.length + this.leftOver.length);
                data.set(this.leftOver, 0);
                data.set(previousData, this.leftOver.length);
            } else {
                data = this.leftOver.concat(data);
            }
            this.leftOver = null;
        }
        var nextBoundary = utf8border(data);
        var usableData = data;
        if (nextBoundary !== data.length) {
            if (support.uint8array) {
                usableData = data.subarray(0, nextBoundary);
                this.leftOver = data.subarray(nextBoundary, data.length);
            } else {
                usableData = data.slice(0, nextBoundary);
                this.leftOver = data.slice(nextBoundary, data.length);
            }
        }
        this.push({
            data: utf8.utf8decode(usableData),
            meta: chunk.meta
        });
    };
    Utf8DecodeWorker.prototype.flush = function () {
        if (this.leftOver && this.leftOver.length) {
            this.push({
                data: utf8.utf8decode(this.leftOver),
                meta: {}
            });
            this.leftOver = null;
        }
    };
    utf8.Utf8DecodeWorker = Utf8DecodeWorker;
    function Utf8EncodeWorker() {
        GenericWorker.call(this, 'utf-8 encode');
    }
    utils.inherits(Utf8EncodeWorker, GenericWorker);
    Utf8EncodeWorker.prototype.processChunk = function (chunk) {
        this.push({
            data: utf8.utf8encode(chunk.data),
            meta: chunk.meta
        });
    };
    utf8.Utf8EncodeWorker = Utf8EncodeWorker;

    return utf8;
});
define('skylark-jszip/stream/ConvertWorker',[
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
define('skylark-jszip/stream/StreamHelper',[
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
define('skylark-jszip/defaults',[], function () {
    'use strict';
    var exports = {};
    var module = { exports: {} };
    exports.base64 = false;
    exports.binary = false;
    exports.dir = false;
    exports.createFolders = true;
    exports.date = null;
    exports.compression = null;
    exports.compressionOptions = null;
    exports.comment = null;
    exports.unixPermissions = null;
    exports.dosPermissions = null;
    function __isEmptyObject(obj) {
        var attr;
        for (attr in obj)
            return !1;
        return !0;
    }
    function __isValidToReturn(obj) {
        return typeof obj != 'object' || Array.isArray(obj) || !__isEmptyObject(obj);
    }
    if (__isValidToReturn(module.exports))
        return module.exports;
    else if (__isValidToReturn(exports))
        return exports;
});
define('skylark-jszip/stream/DataWorker',[
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
define('skylark-jszip/crc32',['./utils'], function (utils) {
    'use strict';

    function makeTable() {
        var c, table = [];
        for (var n = 0; n < 256; n++) {
            c = n;
            for (var k = 0; k < 8; k++) {
                c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
            }
            table[n] = c;
        }
        return table;
    }
    var crcTable = makeTable();
    function crc32(crc, buf, len, pos) {
        var t = crcTable, end = pos + len;
        crc = crc ^ -1;
        for (var i = pos; i < end; i++) {
            crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
        }
        return crc ^ -1;
    }
    function crc32str(crc, str, len, pos) {
        var t = crcTable, end = pos + len;
        crc = crc ^ -1;
        for (var i = pos; i < end; i++) {
            crc = crc >>> 8 ^ t[(crc ^ str.charCodeAt(i)) & 255];
        }
        return crc ^ -1;
    }
    function crc32wrapper(input, crc) {
        if (typeof input === 'undefined' || !input.length) {
            return 0;
        }
        var isArray = utils.getTypeOf(input) !== 'string';
        if (isArray) {
            return crc32(crc | 0, input, input.length, 0);
        } else {
            return crc32str(crc | 0, input, input.length, 0);
        }
    }

    return crc32wrapper;
});
define('skylark-jszip/stream/Crc32Probe',[
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
define('skylark-jszip/stream/DataLengthProbe',[
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
define('skylark-jszip/compressedObject',[
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
define('skylark-jszip/zipObject',[
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
define('skylark-jszip/flate',[
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
define('skylark-jszip/compressions',[
    './stream/GenericWorker',
    './flate'
], function (GenericWorker, DEFLATE) {
    'use strict';

    var STORE = {
        magic: '\0\0',
        compressWorker: function () {
            return new GenericWorker('STORE compression');
        },
        uncompressWorker: function () {
            return new GenericWorker('STORE decompression');
        }
    };

    return {
        STORE,
        DEFLATE
    }
});
define('skylark-jszip/signature',[], function () {
    'use strict';

    const LOCAL_FILE_HEADER = 'PK\x03\x04';
    const CENTRAL_FILE_HEADER = 'PK\x01\x02';
    const CENTRAL_DIRECTORY_END = 'PK\x05\x06';
    const ZIP64_CENTRAL_DIRECTORY_LOCATOR = 'PK\x06\x07';
    const ZIP64_CENTRAL_DIRECTORY_END = 'PK\x06\x06';
    const DATA_DESCRIPTOR = 'PK\x07\b';

    return {
        LOCAL_FILE_HEADER,
        CENTRAL_FILE_HEADER,
        CENTRAL_DIRECTORY_END,
        ZIP64_CENTRAL_DIRECTORY_LOCATOR,
        ZIP64_CENTRAL_DIRECTORY_END,
        DATA_DESCRIPTOR
    };
});
define('skylark-jszip/generate/ZipFileWorker',[
    '../utils',
    '../stream/GenericWorker',
    '../utf8',
    '../crc32',
    '../signature'
], function (utils, GenericWorker, utf8, crc32, signature) {
    'use strict';

    var decToHex = function (dec, bytes) {
        var hex = '', i;
        for (i = 0; i < bytes; i++) {
            hex += String.fromCharCode(dec & 255);
            dec = dec >>> 8;
        }
        return hex;
    };
    var generateUnixExternalFileAttr = function (unixPermissions, isDir) {
        var result = unixPermissions;
        if (!unixPermissions) {
            result = isDir ? 16893 : 33204;
        }
        return (result & 65535) << 16;
    };
    var generateDosExternalFileAttr = function (dosPermissions) {
        return (dosPermissions || 0) & 63;
    };
    var generateZipParts = function (streamInfo, streamedContent, streamingEnded, offset, platform, encodeFileName) {
        var file = streamInfo['file'], compression = streamInfo['compression'], useCustomEncoding = encodeFileName !== utf8.utf8encode, encodedFileName = utils.transformTo('string', encodeFileName(file.name)), utfEncodedFileName = utils.transformTo('string', utf8.utf8encode(file.name)), comment = file.comment, encodedComment = utils.transformTo('string', encodeFileName(comment)), utfEncodedComment = utils.transformTo('string', utf8.utf8encode(comment)), useUTF8ForFileName = utfEncodedFileName.length !== file.name.length, useUTF8ForComment = utfEncodedComment.length !== comment.length, dosTime, dosDate, extraFields = '', unicodePathExtraField = '', unicodeCommentExtraField = '', dir = file.dir, date = file.date;
        var dataInfo = {
            crc32: 0,
            compressedSize: 0,
            uncompressedSize: 0
        };
        if (!streamedContent || streamingEnded) {
            dataInfo.crc32 = streamInfo['crc32'];
            dataInfo.compressedSize = streamInfo['compressedSize'];
            dataInfo.uncompressedSize = streamInfo['uncompressedSize'];
        }
        var bitflag = 0;
        if (streamedContent) {
            bitflag |= 8;
        }
        if (!useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment)) {
            bitflag |= 2048;
        }
        var extFileAttr = 0;
        var versionMadeBy = 0;
        if (dir) {
            extFileAttr |= 16;
        }
        if (platform === 'UNIX') {
            versionMadeBy = 798;
            extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
        } else {
            versionMadeBy = 20;
            extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
        }
        dosTime = date.getUTCHours();
        dosTime = dosTime << 6;
        dosTime = dosTime | date.getUTCMinutes();
        dosTime = dosTime << 5;
        dosTime = dosTime | date.getUTCSeconds() / 2;
        dosDate = date.getUTCFullYear() - 1980;
        dosDate = dosDate << 4;
        dosDate = dosDate | date.getUTCMonth() + 1;
        dosDate = dosDate << 5;
        dosDate = dosDate | date.getUTCDate();
        if (useUTF8ForFileName) {
            unicodePathExtraField = decToHex(1, 1) + decToHex(crc32(encodedFileName), 4) + utfEncodedFileName;
            extraFields += 'up' + decToHex(unicodePathExtraField.length, 2) + unicodePathExtraField;
        }
        if (useUTF8ForComment) {
            unicodeCommentExtraField = decToHex(1, 1) + decToHex(crc32(encodedComment), 4) + utfEncodedComment;
            extraFields += 'uc' + decToHex(unicodeCommentExtraField.length, 2) + unicodeCommentExtraField;
        }
        var header = '';
        header += '\n\0';
        header += decToHex(bitflag, 2);
        header += compression.magic;
        header += decToHex(dosTime, 2);
        header += decToHex(dosDate, 2);
        header += decToHex(dataInfo.crc32, 4);
        header += decToHex(dataInfo.compressedSize, 4);
        header += decToHex(dataInfo.uncompressedSize, 4);
        header += decToHex(encodedFileName.length, 2);
        header += decToHex(extraFields.length, 2);
        var fileRecord = signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields;
        var dirRecord = signature.CENTRAL_FILE_HEADER + decToHex(versionMadeBy, 2) + header + decToHex(encodedComment.length, 2) + '\0\0' + '\0\0' + decToHex(extFileAttr, 4) + decToHex(offset, 4) + encodedFileName + extraFields + encodedComment;
        return {
            fileRecord: fileRecord,
            dirRecord: dirRecord
        };
    };
    var generateCentralDirectoryEnd = function (entriesCount, centralDirLength, localDirLength, comment, encodeFileName) {
        var dirEnd = '';
        var encodedComment = utils.transformTo('string', encodeFileName(comment));
        dirEnd = signature.CENTRAL_DIRECTORY_END + '\0\0' + '\0\0' + decToHex(entriesCount, 2) + decToHex(entriesCount, 2) + decToHex(centralDirLength, 4) + decToHex(localDirLength, 4) + decToHex(encodedComment.length, 2) + encodedComment;
        return dirEnd;
    };
    var generateDataDescriptors = function (streamInfo) {
        var descriptor = '';
        descriptor = signature.DATA_DESCRIPTOR + decToHex(streamInfo['crc32'], 4) + decToHex(streamInfo['compressedSize'], 4) + decToHex(streamInfo['uncompressedSize'], 4);
        return descriptor;
    };
    function ZipFileWorker(streamFiles, comment, platform, encodeFileName) {
        GenericWorker.call(this, 'ZipFileWorker');
        this.bytesWritten = 0;
        this.zipComment = comment;
        this.zipPlatform = platform;
        this.encodeFileName = encodeFileName;
        this.streamFiles = streamFiles;
        this.accumulate = false;
        this.contentBuffer = [];
        this.dirRecords = [];
        this.currentSourceOffset = 0;
        this.entriesCount = 0;
        this.currentFile = null;
        this._sources = [];
    }
    utils.inherits(ZipFileWorker, GenericWorker);
    ZipFileWorker.prototype.push = function (chunk) {
        var currentFilePercent = chunk.meta.percent || 0;
        var entriesCount = this.entriesCount;
        var remainingFiles = this._sources.length;
        if (this.accumulate) {
            this.contentBuffer.push(chunk);
        } else {
            this.bytesWritten += chunk.data.length;
            GenericWorker.prototype.push.call(this, {
                data: chunk.data,
                meta: {
                    currentFile: this.currentFile,
                    percent: entriesCount ? (currentFilePercent + 100 * (entriesCount - remainingFiles - 1)) / entriesCount : 100
                }
            });
        }
    };
    ZipFileWorker.prototype.openedSource = function (streamInfo) {
        this.currentSourceOffset = this.bytesWritten;
        this.currentFile = streamInfo['file'].name;
        var streamedContent = this.streamFiles && !streamInfo['file'].dir;
        if (streamedContent) {
            var record = generateZipParts(streamInfo, streamedContent, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({
                data: record.fileRecord,
                meta: { percent: 0 }
            });
        } else {
            this.accumulate = true;
        }
    };
    ZipFileWorker.prototype.closedSource = function (streamInfo) {
        this.accumulate = false;
        var streamedContent = this.streamFiles && !streamInfo['file'].dir;
        var record = generateZipParts(streamInfo, streamedContent, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
        this.dirRecords.push(record.dirRecord);
        if (streamedContent) {
            this.push({
                data: generateDataDescriptors(streamInfo),
                meta: { percent: 100 }
            });
        } else {
            this.push({
                data: record.fileRecord,
                meta: { percent: 0 }
            });
            while (this.contentBuffer.length) {
                this.push(this.contentBuffer.shift());
            }
        }
        this.currentFile = null;
    };
    ZipFileWorker.prototype.flush = function () {
        var localDirLength = this.bytesWritten;
        for (var i = 0; i < this.dirRecords.length; i++) {
            this.push({
                data: this.dirRecords[i],
                meta: { percent: 100 }
            });
        }
        var centralDirLength = this.bytesWritten - localDirLength;
        var dirEnd = generateCentralDirectoryEnd(this.dirRecords.length, centralDirLength, localDirLength, this.zipComment, this.encodeFileName);
        this.push({
            data: dirEnd,
            meta: { percent: 100 }
        });
    };
    ZipFileWorker.prototype.prepareNextSource = function () {
        this.previous = this._sources.shift();
        this.openedSource(this.previous.streamInfo);
        if (this.isPaused) {
            this.previous.pause();
        } else {
            this.previous.resume();
        }
    };
    ZipFileWorker.prototype.registerPrevious = function (previous) {
        this._sources.push(previous);
        var self = this;
        previous.on('data', function (chunk) {
            self.processChunk(chunk);
        });
        previous.on('end', function () {
            self.closedSource(self.previous.streamInfo);
            if (self._sources.length) {
                self.prepareNextSource();
            } else {
                self.end();
            }
        });
        previous.on('error', function (e) {
            self.error(e);
        });
        return this;
    };
    ZipFileWorker.prototype.resume = function () {
        if (!GenericWorker.prototype.resume.call(this)) {
            return false;
        }
        if (!this.previous && this._sources.length) {
            this.prepareNextSource();
            return true;
        }
        if (!this.previous && !this._sources.length && !this.generatedError) {
            this.end();
            return true;
        }
    };
    ZipFileWorker.prototype.error = function (e) {
        var sources = this._sources;
        if (!GenericWorker.prototype.error.call(this, e)) {
            return false;
        }
        for (var i = 0; i < sources.length; i++) {
            try {
                sources[i].error(e);
            } catch (e) {
            }
        }
        return true;
    };
    ZipFileWorker.prototype.lock = function () {
        GenericWorker.prototype.lock.call(this);
        var sources = this._sources;
        for (var i = 0; i < sources.length; i++) {
            sources[i].lock();
        }
    };

    return ZipFileWorker;

});
define('skylark-jszip/generate',[
    './compressions',
    './generate/ZipFileWorker'
], function (compressions, ZipFileWorker) {
    'use strict';

    var getCompression = function (fileCompression, zipCompression) {
        var compressionName = fileCompression || zipCompression;
        var compression = compressions[compressionName];
        if (!compression) {
            throw new Error(compressionName + ' is not a valid compression method !');
        }
        return compression;
    };
    function generateWorker(zip, options, comment) {
        var zipFileWorker = new ZipFileWorker(options.streamFiles, comment, options.platform, options.encodeFileName);
        var entriesCount = 0;
        try {
            zip.forEach(function (relativePath, file) {
                entriesCount++;
                var compression = getCompression(file.options.compression, options.compression);
                var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
                var dir = file.dir, date = file.date;
                file._compressWorker(compression, compressionOptions).withStreamInfo('file', {
                    name: relativePath,
                    dir: dir,
                    date: date,
                    comment: file.comment || '',
                    unixPermissions: file.unixPermissions,
                    dosPermissions: file.dosPermissions
                }).pipe(zipFileWorker);
            });
            zipFileWorker.entriesCount = entriesCount;
        } catch (e) {
            zipFileWorker.error(e);
        }
        return zipFileWorker;
    };

    return generateWorker;

});
define('skylark-jszip/object',[
    './utf8',
    './utils',
    './stream/GenericWorker',
    './stream/StreamHelper',
    './defaults',
    './compressedObject',
    './zipObject',
    './generate'
], function (utf8, utils, GenericWorker, StreamHelper, defaults, CompressedObject, ZipObject, generate) {
    'use strict';

    var fileAdd = function (name, data, originalOptions) {
        var dataType = utils.getTypeOf(data), parent;
        var o = utils.extend(originalOptions || {}, defaults);
        o.date = o.date || new Date();
        if (o.compression !== null) {
            o.compression = o.compression.toUpperCase();
        }
        if (typeof o.unixPermissions === 'string') {
            o.unixPermissions = parseInt(o.unixPermissions, 8);
        }
        if (o.unixPermissions && o.unixPermissions & 16384) {
            o.dir = true;
        }
        if (o.dosPermissions && o.dosPermissions & 16) {
            o.dir = true;
        }
        if (o.dir) {
            name = forceTrailingSlash(name);
        }
        if (o.createFolders && (parent = parentFolder(name))) {
            folderAdd.call(this, parent, true);
        }
        var isUnicodeString = dataType === 'string' && o.binary === false && o.base64 === false;
        if (!originalOptions || typeof originalOptions.binary === 'undefined') {
            o.binary = !isUnicodeString;
        }
        var isCompressedEmpty = data instanceof CompressedObject && data.uncompressedSize === 0;
        if (isCompressedEmpty || o.dir || !data || data.length === 0) {
            o.base64 = false;
            o.binary = true;
            data = '';
            o.compression = 'STORE';
            dataType = 'string';
        }
        var zipObjectContent = null;
        if (data instanceof CompressedObject || data instanceof GenericWorker) {
            zipObjectContent = data;
        ///} else if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        ///    zipObjectContent = new NodejsStreamInputAdapter(name, data);
        } else {
            zipObjectContent = utils.prepareContent(name, data, o.binary, o.optimizedBinaryString, o.base64);
        }
        var object = new ZipObject(name, zipObjectContent, o);
        this.files[name] = object;
    };
    var parentFolder = function (path) {
        if (path.slice(-1) === '/') {
            path = path.substring(0, path.length - 1);
        }
        var lastSlash = path.lastIndexOf('/');
        return lastSlash > 0 ? path.substring(0, lastSlash) : '';
    };
    var forceTrailingSlash = function (path) {
        if (path.slice(-1) !== '/') {
            path += '/';
        }
        return path;
    };
    var folderAdd = function (name, createFolders) {
        createFolders = typeof createFolders !== 'undefined' ? createFolders : defaults.createFolders;
        name = forceTrailingSlash(name);
        if (!this.files[name]) {
            fileAdd.call(this, name, null, {
                dir: true,
                createFolders: createFolders
            });
        }
        return this.files[name];
    };
    function isRegExp(object) {
        return Object.prototype.toString.call(object) === '[object RegExp]';
    }
    var out = {
        load: function () {
            throw new Error('This method has been removed in JSZip 3.0, please check the upgrade guide.');
        },
        forEach: function (cb) {
            var filename, relativePath, file;
            for (filename in this.files) {
                file = this.files[filename];
                relativePath = filename.slice(this.root.length, filename.length);
                if (relativePath && filename.slice(0, this.root.length) === this.root) {
                    cb(relativePath, file);
                }
            }
        },
        filter: function (search) {
            var result = [];
            this.forEach(function (relativePath, entry) {
                if (search(relativePath, entry)) {
                    result.push(entry);
                }
            });
            return result;
        },
        file: function (name, data, o) {
            if (arguments.length === 1) {
                if (isRegExp(name)) {
                    var regexp = name;
                    return this.filter(function (relativePath, file) {
                        return !file.dir && regexp.test(relativePath);
                    });
                } else {
                    var obj = this.files[this.root + name];
                    if (obj && !obj.dir) {
                        return obj;
                    } else {
                        return null;
                    }
                }
            } else {
                name = this.root + name;
                fileAdd.call(this, name, data, o);
            }
            return this;
        },
        folder: function (arg) {
            if (!arg) {
                return this;
            }
            if (isRegExp(arg)) {
                return this.filter(function (relativePath, file) {
                    return file.dir && arg.test(relativePath);
                });
            }
            var name = this.root + arg;
            var newFolder = folderAdd.call(this, name);
            var ret = this.clone();
            ret.root = newFolder.name;
            return ret;
        },
        remove: function (name) {
            name = this.root + name;
            var file = this.files[name];
            if (!file) {
                if (name.slice(-1) !== '/') {
                    name += '/';
                }
                file = this.files[name];
            }
            if (file && !file.dir) {
                delete this.files[name];
            } else {
                var kids = this.filter(function (relativePath, file) {
                    return file.name.slice(0, name.length) === name;
                });
                for (var i = 0; i < kids.length; i++) {
                    delete this.files[kids[i].name];
                }
            }
            return this;
        },
        generate: function () {
            throw new Error('This method has been removed in JSZip 3.0, please check the upgrade guide.');
        },
        generateInternalStream: function (options) {
            var worker, opts = {};
            try {
                opts = utils.extend(options || {}, {
                    streamFiles: false,
                    compression: 'STORE',
                    compressionOptions: null,
                    type: '',
                    platform: 'DOS',
                    comment: null,
                    mimeType: 'application/zip',
                    encodeFileName: utf8.utf8encode
                });
                opts.type = opts.type.toLowerCase();
                opts.compression = opts.compression.toUpperCase();
                if (opts.type === 'binarystring') {
                    opts.type = 'string';
                }
                if (!opts.type) {
                    throw new Error('No output type specified.');
                }
                utils.checkSupport(opts.type);
                if (opts.platform === 'darwin' || opts.platform === 'freebsd' || opts.platform === 'linux' || opts.platform === 'sunos') {
                    opts.platform = 'UNIX';
                }
                if (opts.platform === 'win32') {
                    opts.platform = 'DOS';
                }
                var comment = opts.comment || this.comment || '';
                worker = generate.generateWorker(this, opts, comment);
            } catch (e) {
                worker = new GenericWorker('error');
                worker.error(e);
            }
            return new StreamHelper(worker, opts.type || 'string', opts.mimeType);
        },
        generateAsync: function (options, onUpdate) {
            return this.generateInternalStream(options).accumulate(onUpdate);
        },
        generateNodeStream: function (options, onUpdate) {
            options = options || {};
            if (!options.type) {
                options.type = 'nodebuffer';
            }
            return this.generateInternalStream(options).toNodejsStream(onUpdate);
        }
    };

    return out;

});
define('skylark-jszip/reader/ArrayReader',[
    "skylark-io-readers/array-reader"
], function (ArrayReader) {
    'use strict';

    return ArrayReader;

});
define('skylark-jszip/reader/StringReader',[
    "skylark-io-readers/string-reader"
], function (StringReader) {
    'use strict';

    return StringReader;

});
define('skylark-jszip/reader/NodeBufferReader',[
    "skylark-io-readers/buffer-reader"
], function (BufferReader) {
    'use strict';

    return BufferReader;

});
define('skylark-jszip/reader/Uint8ArrayReader',[
    "skylark-io-readers/uint8-array-reader"
], function (Uint8ArrayReader) {
    'use strict';

    return Uint8ArrayReader;

});
define('skylark-jszip/reader/readerFor',[
    '../utils',
    '../support',
    './ArrayReader',
    './StringReader',
    './NodeBufferReader',
    './Uint8ArrayReader'
], function (utils, support, ArrayReader, StringReader, NodeBufferReader, Uint8ArrayReader) {
    'use strict';

    function readerFor(data) {
        var type = utils.getTypeOf(data);
        utils.checkSupport(type);
        if (type === 'string' && !support.uint8array) {
            return new StringReader(data);
        }
        if (type === 'nodebuffer') {
            return new NodeBufferReader(data);
        }
        if (support.uint8array) {
            return new Uint8ArrayReader(utils.transformTo('uint8array', data));
        }
        return new ArrayReader(utils.transformTo('array', data));
    }

    return readerFor;
});
define('skylark-jszip/zipEntry',[
    './reader/readerFor',
    './utils',
    './compressedObject',
    './crc32',
    './utf8',
    './compressions',
    './support'
], function (readerFor, utils, CompressedObject, crc32fn, utf8, compressions, support) {
    'use strict';

    var MADE_BY_DOS = 0;
    var MADE_BY_UNIX = 3;
    var findCompression = function (compressionMethod) {
        for (var method in compressions) {
            if (!Object.prototype.hasOwnProperty.call(compressions, method)) {
                continue;
            }
            if (compressions[method].magic === compressionMethod) {
                return compressions[method];
            }
        }
        return null;
    };
    function ZipEntry(options, loadOptions) {
        this.options = options;
        this.loadOptions = loadOptions;
    }
    ZipEntry.prototype = {
        isEncrypted: function () {
            return (this.bitFlag & 1) === 1;
        },
        useUTF8: function () {
            return (this.bitFlag & 2048) === 2048;
        },
        readLocalPart: function (reader) {
            var compression, localExtraFieldsLength;
            reader.skip(22);
            this.fileNameLength = reader.readInt(2);
            localExtraFieldsLength = reader.readInt(2);
            this.fileName = reader.readData(this.fileNameLength);
            reader.skip(localExtraFieldsLength);
            if (this.compressedSize === -1 || this.uncompressedSize === -1) {
                throw new Error("Bug or corrupted zip : didn't get enough information from the central directory " + '(compressedSize === -1 || uncompressedSize === -1)');
            }
            compression = findCompression(this.compressionMethod);
            if (compression === null) {
                throw new Error('Corrupted zip : compression ' + utils.pretty(this.compressionMethod) + ' unknown (inner file : ' + utils.transformTo('string', this.fileName) + ')');
            }
            this.decompressed = new CompressedObject(this.compressedSize, this.uncompressedSize, this.crc32, compression, reader.readData(this.compressedSize));
        },
        readCentralPart: function (reader) {
            this.versionMadeBy = reader.readInt(2);
            reader.skip(2);
            this.bitFlag = reader.readInt(2);
            this.compressionMethod = reader.readString(2);
            this.date = reader.readDate();
            this.crc32 = reader.readInt(4);
            this.compressedSize = reader.readInt(4);
            this.uncompressedSize = reader.readInt(4);
            var fileNameLength = reader.readInt(2);
            this.extraFieldsLength = reader.readInt(2);
            this.fileCommentLength = reader.readInt(2);
            this.diskNumberStart = reader.readInt(2);
            this.internalFileAttributes = reader.readInt(2);
            this.externalFileAttributes = reader.readInt(4);
            this.localHeaderOffset = reader.readInt(4);
            if (this.isEncrypted()) {
                throw new Error('Encrypted zip are not supported');
            }
            reader.skip(fileNameLength);
            this.readExtraFields(reader);
            this.parseZIP64ExtraField(reader);
            this.fileComment = reader.readData(this.fileCommentLength);
        },
        processAttributes: function () {
            this.unixPermissions = null;
            this.dosPermissions = null;
            var madeBy = this.versionMadeBy >> 8;
            this.dir = this.externalFileAttributes & 16 ? true : false;
            if (madeBy === MADE_BY_DOS) {
                this.dosPermissions = this.externalFileAttributes & 63;
            }
            if (madeBy === MADE_BY_UNIX) {
                this.unixPermissions = this.externalFileAttributes >> 16 & 65535;
            }
            if (!this.dir && this.fileNameStr.slice(-1) === '/') {
                this.dir = true;
            }
        },
        parseZIP64ExtraField: function () {
            if (!this.extraFields[1]) {
                return;
            }
            var extraReader = readerFor(this.extraFields[1].value);
            if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
                this.uncompressedSize = extraReader.readInt(8);
            }
            if (this.compressedSize === utils.MAX_VALUE_32BITS) {
                this.compressedSize = extraReader.readInt(8);
            }
            if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
                this.localHeaderOffset = extraReader.readInt(8);
            }
            if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
                this.diskNumberStart = extraReader.readInt(4);
            }
        },
        readExtraFields: function (reader) {
            var end = reader.index + this.extraFieldsLength, extraFieldId, extraFieldLength, extraFieldValue;
            if (!this.extraFields) {
                this.extraFields = {};
            }
            while (reader.index + 4 < end) {
                extraFieldId = reader.readInt(2);
                extraFieldLength = reader.readInt(2);
                extraFieldValue = reader.readData(extraFieldLength);
                this.extraFields[extraFieldId] = {
                    id: extraFieldId,
                    length: extraFieldLength,
                    value: extraFieldValue
                };
            }
            reader.setIndex(end);
        },
        handleUTF8: function () {
            var decodeParamType = support.uint8array ? 'uint8array' : 'array';
            if (this.useUTF8()) {
                this.fileNameStr = utf8.utf8decode(this.fileName);
                this.fileCommentStr = utf8.utf8decode(this.fileComment);
            } else {
                var upath = this.findExtraFieldUnicodePath();
                if (upath !== null) {
                    this.fileNameStr = upath;
                } else {
                    var fileNameByteArray = utils.transformTo(decodeParamType, this.fileName);
                    this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
                }
                var ucomment = this.findExtraFieldUnicodeComment();
                if (ucomment !== null) {
                    this.fileCommentStr = ucomment;
                } else {
                    var commentByteArray = utils.transformTo(decodeParamType, this.fileComment);
                    this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
                }
            }
        },
        findExtraFieldUnicodePath: function () {
            var upathField = this.extraFields[28789];
            if (upathField) {
                var extraReader = readerFor(upathField.value);
                if (extraReader.readInt(1) !== 1) {
                    return null;
                }
                if (crc32fn(this.fileName) !== extraReader.readInt(4)) {
                    return null;
                }
                return utf8.utf8decode(extraReader.readData(upathField.length - 5));
            }
            return null;
        },
        findExtraFieldUnicodeComment: function () {
            var ucommentField = this.extraFields[25461];
            if (ucommentField) {
                var extraReader = readerFor(ucommentField.value);
                if (extraReader.readInt(1) !== 1) {
                    return null;
                }
                if (crc32fn(this.fileComment) !== extraReader.readInt(4)) {
                    return null;
                }
                return utf8.utf8decode(extraReader.readData(ucommentField.length - 5));
            }
            return null;
        }
    };

    return ZipEntry;

});
define('skylark-jszip/zipEntries',[
    './reader/readerFor',
    './utils',
    './signature',
    './zipEntry',
    './support'
], function (readerFor, utils, sig, ZipEntry, support) {
    'use strict';

    function ZipEntries(loadOptions) {
        this.files = [];
        this.loadOptions = loadOptions;
    }
    ZipEntries.prototype = {
        checkSignature: function (expectedSignature) {
            if (!this.reader.readAndCheckSignature(expectedSignature)) {
                this.reader.index -= 4;
                var signature = this.reader.readString(4);
                throw new Error('Corrupted zip or bug: unexpected signature ' + '(' + utils.pretty(signature) + ', expected ' + utils.pretty(expectedSignature) + ')');
            }
        },
        isSignature: function (askedIndex, expectedSignature) {
            var currentIndex = this.reader.index;
            this.reader.setIndex(askedIndex);
            var signature = this.reader.readString(4);
            var result = signature === expectedSignature;
            this.reader.setIndex(currentIndex);
            return result;
        },
        readBlockEndOfCentral: function () {
            this.diskNumber = this.reader.readInt(2);
            this.diskWithCentralDirStart = this.reader.readInt(2);
            this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
            this.centralDirRecords = this.reader.readInt(2);
            this.centralDirSize = this.reader.readInt(4);
            this.centralDirOffset = this.reader.readInt(4);
            this.zipCommentLength = this.reader.readInt(2);
            var zipComment = this.reader.readData(this.zipCommentLength);
            var decodeParamType = support.uint8array ? 'uint8array' : 'array';
            var decodeContent = utils.transformTo(decodeParamType, zipComment);
            this.zipComment = this.loadOptions.decodeFileName(decodeContent);
        },
        readBlockZip64EndOfCentral: function () {
            this.zip64EndOfCentralSize = this.reader.readInt(8);
            this.reader.skip(4);
            this.diskNumber = this.reader.readInt(4);
            this.diskWithCentralDirStart = this.reader.readInt(4);
            this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
            this.centralDirRecords = this.reader.readInt(8);
            this.centralDirSize = this.reader.readInt(8);
            this.centralDirOffset = this.reader.readInt(8);
            this.zip64ExtensibleData = {};
            var extraDataSize = this.zip64EndOfCentralSize - 44, index = 0, extraFieldId, extraFieldLength, extraFieldValue;
            while (index < extraDataSize) {
                extraFieldId = this.reader.readInt(2);
                extraFieldLength = this.reader.readInt(4);
                extraFieldValue = this.reader.readData(extraFieldLength);
                this.zip64ExtensibleData[extraFieldId] = {
                    id: extraFieldId,
                    length: extraFieldLength,
                    value: extraFieldValue
                };
            }
        },
        readBlockZip64EndOfCentralLocator: function () {
            this.diskWithZip64CentralDirStart = this.reader.readInt(4);
            this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
            this.disksCount = this.reader.readInt(4);
            if (this.disksCount > 1) {
                throw new Error('Multi-volumes zip are not supported');
            }
        },
        readLocalFiles: function () {
            var i, file;
            for (i = 0; i < this.files.length; i++) {
                file = this.files[i];
                this.reader.setIndex(file.localHeaderOffset);
                this.checkSignature(sig.LOCAL_FILE_HEADER);
                file.readLocalPart(this.reader);
                file.handleUTF8();
                file.processAttributes();
            }
        },
        readCentralDir: function () {
            var file;
            this.reader.setIndex(this.centralDirOffset);
            while (this.reader.readAndCheckSignature(sig.CENTRAL_FILE_HEADER)) {
                file = new ZipEntry({ zip64: this.zip64 }, this.loadOptions);
                file.readCentralPart(this.reader);
                this.files.push(file);
            }
            if (this.centralDirRecords !== this.files.length) {
                if (this.centralDirRecords !== 0 && this.files.length === 0) {
                    throw new Error('Corrupted zip or bug: expected ' + this.centralDirRecords + ' records in central dir, got ' + this.files.length);
                } else {
                }
            }
        },
        readEndOfCentral: function () {
            var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
            if (offset < 0) {
                var isGarbage = !this.isSignature(0, sig.LOCAL_FILE_HEADER);
                if (isGarbage) {
                    throw new Error("Can't find end of central directory : is this a zip file ? " + 'If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html');
                } else {
                    throw new Error("Corrupted zip: can't find end of central directory");
                }
            }
            this.reader.setIndex(offset);
            var endOfCentralDirOffset = offset;
            this.checkSignature(sig.CENTRAL_DIRECTORY_END);
            this.readBlockEndOfCentral();
            if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
                this.zip64 = true;
                offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
                if (offset < 0) {
                    throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
                }
                this.reader.setIndex(offset);
                this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
                this.readBlockZip64EndOfCentralLocator();
                if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
                    this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
                    if (this.relativeOffsetEndOfZip64CentralDir < 0) {
                        throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
                    }
                }
                this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
                this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
                this.readBlockZip64EndOfCentral();
            }
            var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
            if (this.zip64) {
                expectedEndOfCentralDirOffset += 20;
                expectedEndOfCentralDirOffset += 12 + this.zip64EndOfCentralSize;
            }
            var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;
            if (extraBytes > 0) {
                if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) {
                } else {
                    this.reader.zero = extraBytes;
                }
            } else if (extraBytes < 0) {
                throw new Error('Corrupted zip: missing ' + Math.abs(extraBytes) + ' bytes.');
            }
        },
        prepareReader: function (data) {
            this.reader = readerFor(data);
        },
        load: function (data) {
            this.prepareReader(data);
            this.readEndOfCentral();
            this.readCentralDir();
            this.readLocalFiles();
        }
    };
    return ZipEntries;

});
define('skylark-jszip/load',[
    './utils',
    './external',
    './utf8',
    './zipEntries',
    './stream/Crc32Probe'
], function (utils, external, utf8, ZipEntries, Crc32Probe) {
    'use strict';

    function checkEntryCRC32(zipEntry) {
        return new external.Promise(function (resolve, reject) {
            var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
            worker.on('error', function (e) {
                reject(e);
            }).on('end', function () {
                if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) {
                    reject(new Error('Corrupted zip : CRC32 mismatch'));
                } else {
                    resolve();
                }
            }).resume();
        });
    }
    function load(data, options) {
        var zip = this;
        options = utils.extend(options || {}, {
            base64: false,
            checkCRC32: false,
            optimizedBinaryString: false,
            createFolders: false,
            decodeFileName: utf8.utf8decode
        });
        ///if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        ///    return external.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file."));
        ///}
        return utils.prepareContent('the loaded zip file', data, true, options.optimizedBinaryString, options.base64).then(function (data) {
            var zipEntries = new ZipEntries(options);
            zipEntries.load(data);
            return zipEntries;
        }).then(function checkCRC32(zipEntries) {
            var promises = [external.Promise.resolve(zipEntries)];
            var files = zipEntries.files;
            if (options.checkCRC32) {
                for (var i = 0; i < files.length; i++) {
                    promises.push(checkEntryCRC32(files[i]));
                }
            }
            return external.Promise.all(promises);
        }).then(function addFiles(results) {
            var zipEntries = results.shift();
            var files = zipEntries.files;
            for (var i = 0; i < files.length; i++) {
                var input = files[i];
                var unsafeName = input.fileNameStr;
                var safeName = utils.resolve(input.fileNameStr);
                zip.file(safeName, input.decompressed, {
                    binary: true,
                    optimizedBinaryString: true,
                    date: input.date,
                    dir: input.dir,
                    comment: input.fileCommentStr.length ? input.fileCommentStr : null,
                    unixPermissions: input.unixPermissions,
                    dosPermissions: input.dosPermissions,
                    createFolders: options.createFolders
                });
                if (!input.dir) {
                    zip.file(safeName).unsafeOriginalName = unsafeName;
                }
            }
            if (zipEntries.zipComment.length) {
                zip.comment = zipEntries.zipComment;
            }
            return zip;
        });
    };

    return load;
});
define('skylark-jszip/JSZip',[
    './object',
    './load',
    './support',
    './defaults',
    './external'
], function (object, load, support, defaults, external) {
    'use strict';

    function JSZip() {
        if (!(this instanceof JSZip)) {
            return new JSZip();
        }
        if (arguments.length) {
            throw new Error('The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.');
        }
        this.files = Object.create(null);
        this.comment = null;
        this.root = '';
        this.clone = function () {
            var newObj = new JSZip();
            for (var i in this) {
                if (typeof this[i] !== 'function') {
                    newObj[i] = this[i];
                }
            }
            return newObj;
        };
    }
    JSZip.prototype = object;
    JSZip.prototype.loadAsync = load;
    JSZip.support = support;
    JSZip.defaults = defaults;
    JSZip.version = '3.10.1';
    JSZip.loadAsync = function (content, options) {
        return new JSZip().loadAsync(content, options);
    };
    JSZip.external = external;
    return JSZip;

});
define('skylark-jszip/main',[
    "skylark-langx-ns",
    "./JSZip"
], function(skylark, JSZip) {

    var zip = function(data, options) {
        var zip =  new JSZip();
        if (arguments.length>0) {
        	return zip.loadAsync(data, options);
        } else {
        	return zip;
        }
    };

    zip.ZipFile = JSZip

    return skylark.attach("intg.jszip", zip);

});
define('skylark-jszip', ['skylark-jszip/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-jszip.js.map
