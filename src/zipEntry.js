define([
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