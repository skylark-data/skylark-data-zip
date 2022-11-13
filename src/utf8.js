define([
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