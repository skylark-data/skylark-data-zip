define([
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