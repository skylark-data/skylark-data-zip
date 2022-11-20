/**
 * skylark-io-readers - The skylark reader io library.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
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

define('skylark-io-readers/readers',[
    "skylark-langx-ns"
], function(skylark) {

    return skylark.attach("io.readers");
});

define('skylark-io-readers/_reader',[
    "skylark-langx-events",
    "./readers"
], function(events,readers) {

    'use strict';

    var Reader = events.Emitter.inherit({
        klassName: "Reader",
        _construct :  function(data) {
            this.data = data;
            this.length = data.length;
            this.index = 0;
            this.zero = 0;
        },

        checkOffset: function (offset) {
            this.checkIndex(this.index + offset);
        },
        checkIndex: function (newIndex) {
            if (this.length < this.zero + newIndex || newIndex < 0) {
                throw new Error('End of data reached (data length = ' + this.length + ', asked index = ' + newIndex + '). Corrupted zip ?');
            }
        },
        setIndex: function (newIndex) {
            this.checkIndex(newIndex);
            this.index = newIndex;
        },
        skip: function (n) {
            this.setIndex(this.index + n);
        },
        byteAt: function () {
        },
        readInt: function (size) {
            var result = 0, i;
            this.checkOffset(size);
            for (i = this.index + size - 1; i >= this.index; i--) {
                result = (result << 8) + this.byteAt(i);
            }
            this.index += size;
            return result;
        },
        readString: function (size) {
            return utils.transformTo('string', this.readData(size));
        },
        readData: function () {
        },
        lastIndexOfSignature: function () {
        },
        readAndCheckSignature: function () {
        },
        readDate: function () {
            var dostime = this.readInt(4);
            return new Date(Date.UTC((dostime >> 25 & 127) + 1980, (dostime >> 21 & 15) - 1, dostime >> 16 & 31, dostime >> 11 & 31, dostime >> 5 & 63, (dostime & 31) << 1));
        }

    });

    return readers.Reader = Reader;
});
define('skylark-io-readers/array-reader',[
    "./readers",
    './_reader'
], function (readers,Reader) {
    'use strict';

    var ArrayReader = Reader.inherit({
        klassName: "ArrayReader",
        _construct :  function(data) {
            Reader.prototype._construct.call(this,data);
            for (var i = 0; i < this.data.length; i++) {
                data[i] = data[i] & 255;
            }            
        },


        byteAt : function (i) {
            return this.data[this.zero + i];
        },

        lastIndexOfSignature : function (sig) {
            var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3);
            for (var i = this.length - 4; i >= 0; --i) {
                if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
                    return i - this.zero;
                }
            }
            return -1;
        },

        readAndCheckSignature : function (sig) {
            var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3), data = this.readData(4);
            return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
        },

        readData : function (size) {
            this.checkOffset(size);
            if (size === 0) {
                return [];
            }
            var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
            this.index += size;
            return result;
        }
    });

    return readers.ArrayReader = ArrayReader;
});
define('skylark-io-readers/uint8-array-reader',[
    "./readers",
    './array-reader'
], function (readers,ArrayReader) {
    'use strict';

    var Uint8ArrayReader = ArrayReader.inherit({
        klassName: "Uint8ArrayReader",

        readData : function (size) {
            this.checkOffset(size);
            if (size === 0) {
                return new Uint8Array(0);
            }
            var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
            this.index += size;
            return result;
        }
    });


    return readers.Uint8ArrayReader = Uint8ArrayReader;

});
define('skylark-io-readers/buffer-reader',[
    "./readers",
    './uint8-array-reader'
], function (readers,Uint8ArrayReader) {
    'use strict';


    var BufferReader = Uint8ArrayReader.inherit({
        klassName: "BufferReader",

        readData : function (size) {
            this.checkOffset(size);
            var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
            this.index += size;
            return result;
        }
    });


    return readers.BufferReader = BufferReader;
});
define('skylark-io-readers/string-reader',[
    "./readers",
    './_reader'
], function (readers,Reader) {
    'use strict';

    var StringReader = Reader.inherit({
        klassName: "StringReader",

        byteAt : function (i) {
            return this.data.charCodeAt(this.zero + i);
        },

        lastIndexOfSignature : function (sig) {
            return this.data.lastIndexOf(sig) - this.zero;
        },

        readAndCheckSignature : function (sig) {
            var data = this.readData(4);
            return sig === data;
        },

        readData : function (size) {
            this.checkOffset(size);
            var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
            this.index += size;
            return result;
        }
    });
    
    return readers.StringReader = StringReader;
});
define('skylark-io-readers/main',[
    "./readers",
    "./array-reader",
    "./buffer-reader",
    "./string-reader",
    "./uint8-array-reader"
], function(readers) {

	return readers;
});
define('skylark-io-readers', ['skylark-io-readers/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-io-readers.js.map
