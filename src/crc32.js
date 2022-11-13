define(['./utils'], function (utils) {
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