define([
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