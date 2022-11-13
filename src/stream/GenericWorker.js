define([], function () {
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