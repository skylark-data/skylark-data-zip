define([
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