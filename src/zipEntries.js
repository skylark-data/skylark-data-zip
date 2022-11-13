define([
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