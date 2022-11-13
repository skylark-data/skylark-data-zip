define([], function () {
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