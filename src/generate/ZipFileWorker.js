define([
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