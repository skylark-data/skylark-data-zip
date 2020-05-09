/**
 * skylark-storages-cache - The skylarkjs web local storage classes library.
 * @author 
 * @version v0.9.0
 * @link 
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-storages-cache/cache',[
	"skylark-langx/skylark"
],function(skylark){
	return skylark.attach("storages.cache",{});
});
define('skylark-storages-cache/cookie',[
    "skylark-langx/langx",
    "./cache"
], function(langx,cache) {
    function cookie() {
        return cookie;
    }

    langx.mixin(cookie, {
		get : function(name) {
		    if (!sKey || !this.has(name)) { return null; }
				return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"),"$1"));

		},

		has : function(name) {
			return (new RegExp("(?:^|;\\s*)" + escape(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
		},


		list : function() {
		    var values = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
		    for (var i = 0; i < values.length; i++) { 
		    	values[i] = unescape(values[i]); 
		    }
		    return values;
		},

		remove : function(name,path) {
		    if (!name || !this.has(name)) { 
		    	return; 
		   	}
		    document.cookie = escape(name) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (path ? "; path=" + path : "");
		},

		set: function (name, value, expires, path, domain, secure) {
		    if (!name || /^(?:expires|max\-age|path|domain|secure)$/i.test(name)) { return; }

			var type = langx.type(expires);
			if (type === 'number') {
				var date = Date.now();
				date.setTime(date.getTime() + (expire * 24 * 60 * 60 * 1000));
				expires = date;
			} else if (type === 'string') {
				expires = new Date(Date.now() + langx.parseMilliSeconds(expires));
			}

		    document.cookie = escape(name) + "=" + escape(value) + (expires? "; domain=" + expires.toGMTString()  : "") + (domain ? "; domain=" + domain : "") + (path ? "; path=" + path : "") + (secure ? "; secure" : "");
		  }	
    });


    return cache.cookie = cookie;

});


define('skylark-storages-cache/LocalFileSystem',[
    "skylark-langx/langx",
    "./cache"
], function(langx,cache) {
	var Deferred = langx.Deferred,
		requestFileSystem =  window.requestFileSystem || window.webkitRequestFileSystem,
		resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL,
     	BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder;


	function errorHandler(e) {
	  var msg = '';

	  switch (e.code) {
	    case FileError.QUOTA_EXCEEDED_ERR:
	      msg = 'QUOTA_EXCEEDED_ERR';
	      break;
	    case FileError.NOT_FOUND_ERR:
	      msg = 'NOT_FOUND_ERR';
	      break;
	    case FileError.SECURITY_ERR:
	      msg = 'SECURITY_ERR';
	      break;
	    case FileError.INVALID_MODIFICATION_ERR:
	      msg = 'INVALID_MODIFICATION_ERR';
	      break;
	    case FileError.INVALID_STATE_ERR:
	      msg = 'INVALID_STATE_ERR';
	      break;
	    default:
	      msg = 'Unknown Error';
	      break;
	  };

	  return msg;
	}
	
	var LocalFileSystem = langx.Evented.inherit({
		_fs : null,
		_isPersisted : true,
		_cwd : null,

		init:	function (fs) {
			this._fs = fs;
			this._cwd = fs.root;
		},
			

		readfileAsArrayBuffer :  function (path,callback,errback) {
		    this._cwd.getFile(path, {}, function (fileEntry) {
		      fileEntry.file(function (file) {
		        var reader = new FileReader();
		        reader.onloadend = function () {
		          callback(null, this.result);
		        };
		        reader.readAsArrayBuffer(file);
		      }, errback);
		    }, errback);
		},

		readfileAsDataURL :  function (path,callback,errback) {
		    this._cwd.getFile(path, {}, function (fileEntry) {
		      fileEntry.file(function (file) {
		        var reader = new FileReader();
		        reader.onloadend = function () {
		          callback(null, this.result);
		        };
		        reader.readAsDataURL(file);
		      }, errback);
		    }, errback);
		},

		readfileAsText :  function (path,callback,errback) {
		    this._cwd.getFile(path, {}, function (fileEntry) {
		      fileEntry.file(function (file) {
		        var reader = new FileReader();
		        reader.onloadend = function () {
		          callback(null, this.result);
		        };
		        reader.readAsText(file);
		      }, errback);
		    }, errback);
		},

		writefile : function (path, contents, callback,errback) {
		    var self = this,
		    	folders = path.split('/');
		    folders = folders.slice(0, folders.length - 1);

		    this.mkdir(folders.join('/'),function(){
			    self._cwd.getFile(path, {create: true}, function (fileEntry) {
			      fileEntry.createWriter(function (fileWriter) {
			        var truncated = false;
			        fileWriter.onwriteend = function () {
			          if (!truncated) {
			            truncated = true;
			            this.truncate(this.position);
			            return;
			          }
			          callback && callback();
			        };
			        fileWriter.onerror = errback;
			        // TODO: find a way to write as binary too
			        var blob = contents;
			        if (!blob instanceof Blob) {
			        	blob = new Blob([contents], {type: 'text/plain'});
			        } 
			        fileWriter.write(blob);
			      }, errback);
			    }, errback);

		    });
		},

		rmfile : function (path, callback,errback) {
		    this._cwd.getFile(path, {}, function (fileEntry) {
		      fileEntry.remove(function () {
		        callback();
		      }, errback);
		    }, errback);
		},

		readdir : function (path, callback,errback) {
		    this._cwd.getDirectory(path, {}, function (dirEntry) {
		      var dirReader = dirEntry.createReader();
		      var entries = [];
		      readEntries();
		      function readEntries() {
		        dirReader.readEntries(function (results) {
		          if (!results.length) {
		            callback(null, entries);
		          }
		          else {
		            entries = entries.concat(
		            	Array.prototype.slice.call(results).map(
		            		function (entry) {
		              			return entry.name + (entry.isDirectory ? "/" : "");
		            		}
		            	)
		            );
		            readEntries();
		          }
		        }, errback);
		      }
		    }, errback);
		},

		mkdir : function (path, callback,errback) {
		    var folderParts = path.split('/');

		    var createDir = function(rootDir, folders) {
		      // Throw out './' or '/' and move on. Prevents: '/foo/.//bar'.
		      if (folders[0] == '.' || folders[0] == '') {
		        folders = folders.slice(1);
		      }

		      if (folders.length ==0) {
		      	callback(rootDir);
		      	return;
		      }
		      rootDir.getDirectory(folders[0], {create: true, exclusive: false},
		        function (dirEntry) {
		          if (dirEntry.isDirectory) { // TODO: check shouldn't be necessary.
		            // Recursively add the new subfolder if we have more to create and
		            // There was more than one folder to create.
		            if (folders.length && folderParts.length != 1) {
		              createDir(dirEntry, folders.slice(1));
		            } else {
		              // Return the last directory that was created.
		              if (callback) callback(dirEntry);
		            }
		          } else {
		            var e = new Error(path + ' is not a directory');
		            if (errback) {
		              errback(e);
		            } else {
		              throw e;
		            }
		          }
		        },
		        function(e) {
		            if (errback) {
		              errback(e);
		            } else {
		              throw e;
		            }
		        }
		      );
		    };

		    createDir(this._cwd, folderParts);

		},

		rmdir : function (path, callback,errback) {
		    this._cwd.getDirectory(path, {}, function (dirEntry) {
		      dirEntry.removeRecursively(function () {
		        callback();
		      }, errback);
		    }, errback);
		  },

		copy : function (src, dest, callback) {
		    // TODO: make sure works for cases where dest includes and excludes file name.
		    this._cwd.getFile(src, {}, function(fileEntry) {
		      cwd.getDirectory(dest, {}, function(dirEntry) {
		        fileEntry.copyTo(dirEntry, function () {
		          callback();
		        }, callback);
		      }, callback);
		    }, callback);
		},

		move : function(src, dest, callback) {
		    // TODO: handle more cases like file renames and moving/renaming directories
		    this._cwd.getFile(src, {}, function(fileEntry) {
		      cwd.getDirectory(dest, {}, function(dirEntry) {
		        fileEntry.moveTo(dirEntry, function () {
		          callback();
		        }, callback);
		      }, callback);
		    }, callback);
		},

		chdir : function (path, callback) {
		    this._cwd.getDirectory(path, {}, function (dirEntry) {
		      cwd = dirEntry;
		      if (fs.onchdir) {
		        fs.onchdir(cwd.fullPath);
		      }
		      callback();
		    }, callback);
		},

		importFromHost : function(files) {
		    // Duplicate each file the user selected to the app's fs.
		    var deferred = new Deferred();
		    for (var i = 0, file; file = files[i]; ++i) {
		        (function(f) {
			        cwd.getFile(file.name, {create: true, exclusive: true}, function(fileEntry) {
			          fileEntry.createWriter(function(fileWriter) {
			            fileWriter.write(f); // Note: write() can take a File or Blob object.
			          }, errorHandler);
			        }, errorHandler);
		     	})(file);
 	   	 	}
  		    return deferred.promise;
		  },

		  exportToHost : function() {

		  }
	
	});
	


    function localfs() {
        return localfs;
    }

    langx.mixin(LocalFileSystem, {
        isSupported : function() {
            return !!requestFileSystem;
        },
        request : function(size,isPersisted){
        	size = size || 1024 * 1024 * 10;
        	var typ = isPersisted ? PERSISTENT : TEMPORARY,
        		d = new Deferred();
            requestFileSystem(typ, size, function(_fs) {
                var fs = new LocalFileSystem(_fs,!!isPersisted);
                d.resolve(fs);
            }, function(e) {
            	d.reject(e);
            });

            return d.promise;
        }
    });
    
    cache.requestLocalFileSystem = LocalFileSystem.request;

	return cache.LocalFileSystem = LocalFileSystem;
});
define('skylark-storages-cache/localStorage',[
    "skylark-langx/langx",
    "./cache"
], function(langx,cache) {

    var storage  = null;

    try {
        storage = window["localStorage"];
    } catch (e){

    }

    function localStorage() {
        return localStorage;
    }

    langx.mixin(localStorage, {
        isSupported : function() {
            return !!storage;
        },

        set : function(key, val) {
            if (val === undefined) { 
                return this.remove(key) 
            }
            storage.setItem(key, langx.serializeValue(val));
            return val
        },

        get : function(key, defaultVal) {
            var val = langx.deserializeValue(storage.getItem(key))
            return (val === undefined ? defaultVal : val)
        },

        remove : function(key) { 
            storage.removeItem(key) 
        },

        clear : function() { 
            storage.clear() 
        },

        list : function() {
            var vaules = {}
            for (var i=0; i<storage.length; i++) {
                vaules[key] = storage.key(i)
            }

            return values;
        }
    });

    return  cache.localStorage = localStorage;

});


define('skylark-storages-cache/sessionStorage',[
    "skylark-langx/langx",
    "./cache"
], function(langx,cache) {

    var storage  = null;

    try {
        storage = window["sessiionStorage"];
    } catch (e){

    }

    function sessiionStorage() {
        return sessiionStorage;
    }

    langx.mixin(sessiionStorage, {
        isSupported : function() {
            return !!storage;
        },

        set : function(key, val) {
            if (val === undefined) { 
                return this.remove(key) 
            }
            storage.setItem(key, langx.serializeValue(val));
            return val
        },

        get : function(key, defaultVal) {
            var val = langx.deserializeValue(storage.getItem(key))
            return (val === undefined ? defaultVal : val)
        },

        remove : function(key) { 
            storage.removeItem(key) 
        },

        clear : function() { 
            storage.clear() 
        },

        list : function() {
            var vaules = {}
            for (var i=0; i<storage.length; i++) {
                vaules[key] = storage.key(i)
            }

            return values;
        }
    });

    return  cache.sessionStorage = sessionStorage;

});


define('skylark-storages-cache/main',[
	"./cache",
	"./cookie",
	"./LocalFileSystem",
	"./localStorage",
	"./sessionStorage"
],function(cache) {
	return cache;
});
define('skylark-storages-cache', ['skylark-storages-cache/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-storages-cache.js.map
