/**
 * skylark-jszip - A skylark wrapper for jszip.
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

define('skylark-langx-ns/_attach',[],function(){
    return  function attach(obj1,path,obj2) {
        if (typeof path == "string") {
            path = path.split(".");//[path]
        };
        var length = path.length,
            ns=obj1,
            i=0,
            name = path[i++];

        while (i < length) {
            ns = ns[name] = ns[name] || {};
            name = path[i++];
        }

        if (ns[name]) {
            if (obj2) {
                throw new Error("This namespace already exists:" + path);
            }

        } else {
            ns[name] = obj2 || {};
        }
        return ns[name];
    }
});
define('skylark-langx-ns/ns',[
    "./_attach"
], function(_attach) {
    var root = {
    	attach : function(path,obj) {
    		return _attach(root,path,obj);
    	}
    };
    return root;
});

define('skylark-langx-ns/main',[
	"./ns"
],function(skylark){
	return skylark;
});
define('skylark-langx-ns', ['skylark-langx-ns/main'], function (main) { return main; });

define('skylark-langx-binary/binary',[
  "skylark-langx-ns",
],function(skylark){
	"use strict";


	/**
	 * Create arraybuffer from binary string
	 *
	 * @method fromBinaryString
	 * @param {String} str
	 * @return {Arraybuffer} data
	 */
	function fromBinaryString(str) {
		var length = str.length;
		var arraybuffer = new ArrayBuffer(length);
		var view = new Uint8Array(arraybuffer);

		for(var i = 0; i < length; i++)
		{
			view[i] = str.charCodeAt(i);
		}

		return arraybuffer;
	}

	/**
	 * Create arraybuffer from base64 string
	 *
	 * @method fromBase64
	 * @param {String} base64
	 * @return {Arraybuffer} data
	 */
	function fromBase64(str){
		var encoding = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		var length = str.length / 4 * 3;
		var arraybuffer = new ArrayBuffer(length);
		var view = new Uint8Array(arraybuffer);

		var a, b, c, d;

		for(var i = 0, j = 0; i < length; i += 3)
		{
			a = encoding.indexOf(str.charAt(j++));
			b = encoding.indexOf(str.charAt(j++));
			c = encoding.indexOf(str.charAt(j++));
			d = encoding.indexOf(str.charAt(j++));

			view[i] = (a << 2) | (b >> 4);
			if(c !== 64)
			{
				view[i+1] = ((b & 15) << 4) | (c >> 2);
			}
			if(d !== 64)
			{
				view[i+2] = ((c & 3) << 6) | d;
			}
		}

		return arraybuffer;
	}

	/**
	 * Create arraybuffer from Nodejs buffer
	 *
	 * @method fromBuffer
	 * @param {Buffer} buffer
	 * @return {Arraybuffer} data
	 */
	function fromBuffer(buffer)	{
		var array = new ArrayBuffer(buffer.length);
		var view = new Uint8Array(array);

		for(var i = 0; i < buffer.length; i++)
		{
			view[i] = buffer[i];
		}

		return array;

		//Faster but the results is failing the "instanceof ArrayBuffer" test
		//return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	}

    function readInt8(data, offset) {
        return data[offset] << 24 >> 24;
    }
    function readUint16(data, offset) {
        return data[offset] << 8 | data[offset + 1];
    }
    function readUint32(data, offset) {
        return (data[offset] << 24 | data[offset + 1] << 16 | data[offset + 2] << 8 | data[offset + 3]) >>> 0;
    }


	return skylark.attach("langx.binary",{
		fromBase64,
		fromBinaryString,
		fromBuffer,
		readInt8,
		readUint16,
		readUint32
	});
});
define('skylark-langx-binary/base64',[],function(){
  'use strict'
  var exports = {};

  exports.byteLength = byteLength
  exports.toByteArray = toByteArray
  exports.fromByteArray = fromByteArray

  var lookup = []
  var revLookup = []
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  // Support decoding URL-safe base64 strings, as Node.js does.
  // See: https://en.wikipedia.org/wiki/Base64#URL_applications
  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63

  function getLens (b64) {
    var len = b64.length

    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4')
    }

    // Trim off extra bytes after placeholder bytes are found
    // See: https://github.com/beatgammit/base64-js/issues/42
    var validLen = b64.indexOf('=')
    if (validLen === -1) validLen = len

    var placeHoldersLen = validLen === len
      ? 0
      : 4 - (validLen % 4)

    return [validLen, placeHoldersLen]
  }

  // base64 is 4/3 + up to two characters of the original data
  function byteLength (b64) {
    var lens = getLens(b64)
    var validLen = lens[0]
    var placeHoldersLen = lens[1]
    return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
  }

  function _byteLength (b64, validLen, placeHoldersLen) {
    return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
  }

  function toByteArray (b64) {
    var tmp
    var lens = getLens(b64)
    var validLen = lens[0]
    var placeHoldersLen = lens[1]

    var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

    var curByte = 0

    // if there are placeholders, only get up to the last complete 4 chars
    var len = placeHoldersLen > 0
      ? validLen - 4
      : validLen

    var i
    for (i = 0; i < len; i += 4) {
      tmp =
        (revLookup[b64.charCodeAt(i)] << 18) |
        (revLookup[b64.charCodeAt(i + 1)] << 12) |
        (revLookup[b64.charCodeAt(i + 2)] << 6) |
        revLookup[b64.charCodeAt(i + 3)]
      arr[curByte++] = (tmp >> 16) & 0xFF
      arr[curByte++] = (tmp >> 8) & 0xFF
      arr[curByte++] = tmp & 0xFF
    }

    if (placeHoldersLen === 2) {
      tmp =
        (revLookup[b64.charCodeAt(i)] << 2) |
        (revLookup[b64.charCodeAt(i + 1)] >> 4)
      arr[curByte++] = tmp & 0xFF
    }

    if (placeHoldersLen === 1) {
      tmp =
        (revLookup[b64.charCodeAt(i)] << 10) |
        (revLookup[b64.charCodeAt(i + 1)] << 4) |
        (revLookup[b64.charCodeAt(i + 2)] >> 2)
      arr[curByte++] = (tmp >> 8) & 0xFF
      arr[curByte++] = tmp & 0xFF
    }

    return arr
  }

  function tripletToBase64 (num) {
    return lookup[num >> 18 & 0x3F] +
      lookup[num >> 12 & 0x3F] +
      lookup[num >> 6 & 0x3F] +
      lookup[num & 0x3F]
  }

  function encodeChunk (uint8, start, end) {
    var tmp
    var output = []
    for (var i = start; i < end; i += 3) {
      tmp =
        ((uint8[i] << 16) & 0xFF0000) +
        ((uint8[i + 1] << 8) & 0xFF00) +
        (uint8[i + 2] & 0xFF)
      output.push(tripletToBase64(tmp))
    }
    return output.join('')
  }

  function fromByteArray (uint8) {
    var tmp
    var len = uint8.length
    var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
    var parts = []
    var maxChunkLength = 16383 // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(
        uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
      ))
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1]
      parts.push(
        lookup[tmp >> 2] +
        lookup[(tmp << 4) & 0x3F] +
        '=='
      )
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1]
      parts.push(
        lookup[tmp >> 10] +
        lookup[(tmp >> 4) & 0x3F] +
        lookup[(tmp << 2) & 0x3F] +
        '='
      )
    }

    return parts.join('')
  }

  return exports;
});
define('skylark-langx-binary/ieee754',[],function(){
  'use strict'
  var exports = {};

  exports.read = function (buffer, offset, isLE, mLen, nBytes) {
    var e, m
    var eLen = (nBytes * 8) - mLen - 1
    var eMax = (1 << eLen) - 1
    var eBias = eMax >> 1
    var nBits = -7
    var i = isLE ? (nBytes - 1) : 0
    var d = isLE ? -1 : 1
    var s = buffer[offset + i]

    i += d

    e = s & ((1 << (-nBits)) - 1)
    s >>= (-nBits)
    nBits += eLen
    for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & ((1 << (-nBits)) - 1)
    e >>= (-nBits)
    nBits += mLen
    for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias
    } else if (e === eMax) {
      return m ? NaN : ((s ? -1 : 1) * Infinity)
    } else {
      m = m + Math.pow(2, mLen)
      e = e - eBias
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
  }

  exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c
    var eLen = (nBytes * 8) - mLen - 1
    var eMax = (1 << eLen) - 1
    var eBias = eMax >> 1
    var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
    var i = isLE ? 0 : (nBytes - 1)
    var d = isLE ? 1 : -1
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

    value = Math.abs(value)

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0
      e = eMax
    } else {
      e = Math.floor(Math.log(value) / Math.LN2)
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--
        c *= 2
      }
      if (e + eBias >= 1) {
        value += rt / c
      } else {
        value += rt * Math.pow(2, 1 - eBias)
      }
      if (value * c >= 2) {
        e++
        c /= 2
      }

      if (e + eBias >= eMax) {
        m = 0
        e = eMax
      } else if (e + eBias >= 1) {
        m = ((value * c) - 1) * Math.pow(2, mLen)
        e = e + eBias
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
        e = 0
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = (e << mLen) | m
    eLen += mLen
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128
  }

  return exports;
});

define('skylark-langx-binary/memory',[
  "./binary",
  "./base64",
  "./ieee754"
],function(binary,base64,ieee754){
  /*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   */
  /* eslint-disable no-proto */

  'use strict'


  Memory.INSPECT_MAX_BYTES = 50

  var K_MAX_LENGTH = 0x7fffffff
  Memory.kMaxLength = K_MAX_LENGTH

  /**
   * If `Memory.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Print warning and recommend using `buffer` v4.x which has an Object
   *               implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * We report that the browser does not support typed arrays if the are not subclassable
   * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
   * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
   * for __proto__ and has a buggy typed array implementation.
   */
  Memory.TYPED_ARRAY_SUPPORT = typedArraySupport()

  if (!Memory.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
      typeof console.error === 'function') {
    console.error(
      'This browser lacks typed array (Uint8Array) support which is required by ' +
      '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
    )
  }

  function typedArraySupport () {
    // Can typed array instances can be augmented?
    try {
      var arr = new Uint8Array(1)
      arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
      return arr.foo() === 42
    } catch (e) {
      return false
    }
  }

  Object.defineProperty(Memory.prototype, 'parent', {
    get: function () {
      if (!(this instanceof Memory)) {
        return undefined
      }
      return this.buffer
    }
  })

  Object.defineProperty(Memory.prototype, 'offset', {
    get: function () {
      if (!(this instanceof Memory)) {
        return undefined
      }
      return this.byteOffset
    }
  })

  function reserveMemory (length) {
    if (length > K_MAX_LENGTH) {
      throw new RangeError('Invalid typed array length')
    }
    // Return an augmented `Uint8Array` instance
    var buf = new Uint8Array(length)
    buf.__proto__ = Memory.prototype
    return buf
  }

  /**
   * The Memory constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Memory.prototype`. Furthermore, `Memory` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Memory` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */

  function Memory (arg, encodingOrOffset, length) {
    // Common case.
    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new Error(
          'If encoding is specified then the first argument must be a string'
        )
      }
      return allocUnsafe(arg)
    }
    return from(arg, encodingOrOffset, length)
  }

  // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Memory[Symbol.species] === Memory) {
    Object.defineProperty(Memory, Symbol.species, {
      value: null,
      configurable: true,
      enumerable: false,
      writable: false
    })
  }

  Memory.poolSize = 8192 // not used by this implementation

  function from (value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('"value" argument must not be a number')
    }

    if (isArrayBuffer(value) || (value && isArrayBuffer(value.buffer))) {
      return fromArrayBuffer(value, encodingOrOffset, length)
    }

    if (typeof value === 'string') {
      return fromString(value, encodingOrOffset)
    }

    return fromObject(value)
  }

  /**
   * Functionally equivalent to Memory(arg, encoding) but throws a TypeError
   * if value is a number.
   * Memory.from(str[, encoding])
   * Memory.from(array)
   * Memory.from(buffer)
   * Memory.from(arrayBuffer[, byteOffset[, length]])
   **/
  Memory.from = function (value, encodingOrOffset, length) {
    return from(value, encodingOrOffset, length)
  }

  // Note: Change prototype *after* Memory.from is defined to workaround Chrome bug:
  // https://github.com/feross/buffer/pull/148
  Memory.prototype.__proto__ = Uint8Array.prototype
  Memory.__proto__ = Uint8Array

  function assertSize (size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be of type number')
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative')
    }
  }

  function alloc (size, fill, encoding) {
    assertSize(size)
    if (size <= 0) {
      return reserveMemory(size)
    }
    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string'
        ? reserveMemory(size).fill(fill, encoding)
        : reserveMemory(size).fill(fill)
    }
    return reserveMemory(size)
  }

  /**
   * Creates a new filled Memory instance.
   * alloc(size[, fill[, encoding]])
   **/
  Memory.alloc = function (size, fill, encoding) {
    return alloc(size, fill, encoding)
  }

  function allocUnsafe (size) {
    assertSize(size)
    return reserveMemory(size < 0 ? 0 : checked(size) | 0)
  }

  /**
   * Equivalent to Memory(num), by default creates a non-zero-filled Memory instance.
   * */
  Memory.allocUnsafe = function (size) {
    return allocUnsafe(size)
  }
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Memory instance.
   */
  Memory.allocUnsafeSlow = function (size) {
    return allocUnsafe(size)
  }

  function fromString (string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8'
    }

    if (!Memory.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }

    var length = byteLength(string, encoding) | 0
    var buf = reserveMemory(length)

    var actual = buf.write(string, encoding)

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      buf = buf.slice(0, actual)
    }

    return buf
  }

  function fromArrayLike (array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0
    var buf = reserveMemory(length)
    for (var i = 0; i < length; i += 1) {
      buf[i] = array[i] & 255
    }
    return buf
  }

  function fromArrayBuffer (array, byteOffset, length) {
    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('"offset" is outside of buffer bounds')
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('"length" is outside of buffer bounds')
    }

    var buf
    if (byteOffset === undefined && length === undefined) {
      buf = new Uint8Array(array)
    } else if (length === undefined) {
      buf = new Uint8Array(array, byteOffset)
    } else {
      buf = new Uint8Array(array, byteOffset, length)
    }

    // Return an augmented `Uint8Array` instance
    buf.__proto__ = Memory.prototype
    return buf
  }

  function fromObject (obj) {
    if (Memory.isBuffer(obj)) {
      var len = checked(obj.length) | 0
      var buf = reserveMemory(len)

      if (buf.length === 0) {
        return buf
      }

      obj.copy(buf, 0, 0, len)
      return buf
    }

    if (obj) {
      if (ArrayBuffer.isView(obj) || 'length' in obj) {
        if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
          return reserveMemory(0)
        }
        return fromArrayLike(obj)
      }

      if (obj.type === 'Memory' && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data)
      }
    }

    throw new TypeError('The first argument must be one of type string, Memory, ArrayBuffer, Array, or Array-like Object.')
  }

  function checked (length) {
    // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= K_MAX_LENGTH) {
      throw new RangeError('Attempt to allocate Memory larger than maximum ' +
                           'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
    }
    return length | 0
  }

  function SlowBuffer (length) {
    if (+length != length) { // eslint-disable-line eqeqeq
      length = 0
    }
    return Memory.alloc(+length)
  }

  Memory.isMemory = Memory.isBuffer = function isMemory (b) {
    return b != null && b._isBuffer === true
  }

  Memory.compare = function compare (a, b) {
    if (!Memory.isMemory(a) || !Memory.isMemory(b)) {
      throw new TypeError('Arguments must be Buffers')
    }

    if (a === b) return 0

    var x = a.length
    var y = b.length

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i]
        y = b[i]
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  }

  Memory.isEncoding = function isEncoding (encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true
      default:
        return false
    }
  }

  Memory.concat = function concat (list, length) {
    if (!Array.isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }

    if (list.length === 0) {
      return Memory.alloc(0)
    }

    var i
    if (length === undefined) {
      length = 0
      for (i = 0; i < list.length; ++i) {
        length += list[i].length
      }
    }

    var buffer = Memory.allocUnsafe(length)
    var pos = 0
    for (i = 0; i < list.length; ++i) {
      var buf = list[i]
      if (ArrayBuffer.isView(buf)) {
        buf = Memory.from(buf)
      }
      if (!Memory.isMemory(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }
      buf.copy(buffer, pos)
      pos += buf.length
    }
    return buffer
  }

  function byteLength (string, encoding) {
    if (Memory.isMemory(string)) {
      return string.length
    }
    if (ArrayBuffer.isView(string) || isArrayBuffer(string)) {
      return string.byteLength
    }
    if (typeof string !== 'string') {
      string = '' + string
    }

    var len = string.length
    if (len === 0) return 0

    // Use a for loop to avoid recursion
    var loweredCase = false
    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len
        case 'utf8':
        case 'utf-8':
        case undefined:
          return utf8ToBytes(string).length
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2
        case 'hex':
          return len >>> 1
        case 'base64':
          return base64ToBytes(string).length
        default:
          if (loweredCase) return utf8ToBytes(string).length // assume utf8
          encoding = ('' + encoding).toLowerCase()
          loweredCase = true
      }
    }
  }
  Memory.byteLength = byteLength


  /**
   * Create arraybuffer from memory
   *
   * @method toArrayBuffer
   * @param {Buffer} buffer
   * @return {Arraybuffer} data
   */
  Memory.toArrayBuffer = function(memory) {
    var array = new ArrayBuffer(memory.length);
    var view = new Uint8Array(array);

    for(var i = 0; i < memory.length; i++){
      view[i] = memory[i];
    }

    return array;

    //Faster but the results is failing the "instanceof ArrayBuffer" test
    //return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  function slowToString (encoding, start, end) {
    var loweredCase = false

    // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.

    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    if (start === undefined || start < 0) {
      start = 0
    }
    // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.
    if (start > this.length) {
      return ''
    }

    if (end === undefined || end > this.length) {
      end = this.length
    }

    if (end <= 0) {
      return ''
    }

    // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
    end >>>= 0
    start >>>= 0

    if (end <= start) {
      return ''
    }

    if (!encoding) encoding = 'utf8'

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end)

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end)

        case 'ascii':
          return asciiSlice(this, start, end)

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end)

        case 'base64':
          return base64Slice(this, start, end)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = (encoding + '').toLowerCase()
          loweredCase = true
      }
    }
  }

  // This property is used by `Memory.isMemory` 
  // to detect a Memory instance. 
  Memory.prototype._isMemory = true

  function swap (b, n, m) {
    var i = b[n]
    b[n] = b[m]
    b[m] = i
  }

  Memory.prototype.swap16 = function swap16 () {
    var len = this.length
    if (len % 2 !== 0) {
      throw new RangeError('Memory size must be a multiple of 16-bits')
    }
    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1)
    }
    return this
  }

  Memory.prototype.swap32 = function swap32 () {
    var len = this.length
    if (len % 4 !== 0) {
      throw new RangeError('Memory size must be a multiple of 32-bits')
    }
    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3)
      swap(this, i + 1, i + 2)
    }
    return this
  }

  Memory.prototype.swap64 = function swap64 () {
    var len = this.length
    if (len % 8 !== 0) {
      throw new RangeError('Memory size must be a multiple of 64-bits')
    }
    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7)
      swap(this, i + 1, i + 6)
      swap(this, i + 2, i + 5)
      swap(this, i + 3, i + 4)
    }
    return this
  }

  Memory.prototype.toString = function toString () {
    var length = this.length
    if (length === 0) return ''
    if (arguments.length === 0) return utf8Slice(this, 0, length)
    return slowToString.apply(this, arguments)
  }

  Memory.prototype.toLocaleString = Memory.prototype.toString

  Memory.prototype.equals = function equals (b) {
    if (!Memory.isMemory(b)) throw new TypeError('Argument must be a Memory')
    if (this === b) return true
    return Memory.compare(this, b) === 0
  }

  Memory.prototype.inspect = function inspect () {
    var str = ''
    var max = Memory.INSPECT_MAX_BYTES
    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
      if (this.length > max) str += ' ... '
    }
    return '<Memory ' + str + '>'
  }

  Memory.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
    if (!Memory.isMemory(target)) {
      throw new TypeError('Argument must be a Memory')
    }

    if (start === undefined) {
      start = 0
    }
    if (end === undefined) {
      end = target ? target.length : 0
    }
    if (thisStart === undefined) {
      thisStart = 0
    }
    if (thisEnd === undefined) {
      thisEnd = this.length
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index')
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0
    }
    if (thisStart >= thisEnd) {
      return -1
    }
    if (start >= end) {
      return 1
    }

    start >>>= 0
    end >>>= 0
    thisStart >>>= 0
    thisEnd >>>= 0

    if (this === target) return 0

    var x = thisEnd - thisStart
    var y = end - start
    var len = Math.min(x, y)

    var thisCopy = this.slice(thisStart, thisEnd)
    var targetCopy = target.slice(start, end)

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i]
        y = targetCopy[i]
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  }

  // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Memory to search
  // - val - a string, Memory, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf
  function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1

    // Normalize byteOffset
    if (typeof byteOffset === 'string') {
      encoding = byteOffset
      byteOffset = 0
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000
    }
    byteOffset = +byteOffset  // Coerce to Number.
    if (numberIsNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : (buffer.length - 1)
    }

    // Normalize byteOffset: negative offsets start from the end of the buffer
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset
    if (byteOffset >= buffer.length) {
      if (dir) return -1
      else byteOffset = buffer.length - 1
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0
      else return -1
    }

    // Normalize val
    if (typeof val === 'string') {
      val = Memory.from(val, encoding)
    }

    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (Memory.isMemory(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
    } else if (typeof val === 'number') {
      val = val & 0xFF // Search for a byte value [0-255]
      if (typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
        }
      }
      return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
    }

    throw new TypeError('val must be string, number or Memory')
  }

  function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
    var indexSize = 1
    var arrLength = arr.length
    var valLength = val.length

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase()
      if (encoding === 'ucs2' || encoding === 'ucs-2' ||
          encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1
        }
        indexSize = 2
        arrLength /= 2
        valLength /= 2
        byteOffset /= 2
      }
    }

    function read (buf, i) {
      if (indexSize === 1) {
        return buf[i]
      } else {
        return buf.readUInt16BE(i * indexSize)
      }
    }

    var i
    if (dir) {
      var foundIndex = -1
      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
        } else {
          if (foundIndex !== -1) i -= i - foundIndex
          foundIndex = -1
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
      for (i = byteOffset; i >= 0; i--) {
        var found = true
        for (var j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false
            break
          }
        }
        if (found) return i
      }
    }

    return -1
  }

  Memory.prototype.includes = function includes (val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1
  }

  Memory.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
  }

  Memory.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
  }

  function hexWrite (buf, string, offset, length) {
    offset = Number(offset) || 0
    var remaining = buf.length - offset
    if (!length) {
      length = remaining
    } else {
      length = Number(length)
      if (length > remaining) {
        length = remaining
      }
    }

    var strLen = string.length

    if (length > strLen / 2) {
      length = strLen / 2
    }
    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16)
      if (numberIsNaN(parsed)) return i
      buf[offset + i] = parsed
    }
    return i
  }

  function utf8Write (buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  }

  function asciiWrite (buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length)
  }

  function latin1Write (buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length)
  }

  function base64Write (buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length)
  }

  function ucs2Write (buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  }

  Memory.prototype.write = function write (string, offset, length, encoding) {
    // Memory#write(string)
    if (offset === undefined) {
      encoding = 'utf8'
      length = this.length
      offset = 0
    // Memory#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset
      length = this.length
      offset = 0
    // Memory#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset >>> 0
      if (isFinite(length)) {
        length = length >>> 0
        if (encoding === undefined) encoding = 'utf8'
      } else {
        encoding = length
        length = undefined
      }
    } else {
      throw new Error(
        'Memory.write(string, encoding, offset[, length]) is no longer supported'
      )
    }

    var remaining = this.length - offset
    if (length === undefined || length > remaining) length = remaining

    if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds')
    }

    if (!encoding) encoding = 'utf8'

    var loweredCase = false
    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length)

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length)

        case 'ascii':
          return asciiWrite(this, string, offset, length)

        case 'latin1':
        case 'binary':
          return latin1Write(this, string, offset, length)

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = ('' + encoding).toLowerCase()
          loweredCase = true
      }
    }
  }

  Memory.prototype.toJSON = function toJSON () {
    return {
      type: 'Memory',
      data: Array.prototype.slice.call(this._arr || this, 0)
    }
  }

  function base64Slice (buf, start, end) {
    if (start === 0 && end === buf.length) {
      return base64.fromByteArray(buf)
    } else {
      return base64.fromByteArray(buf.slice(start, end))
    }
  }

  function utf8Slice (buf, start, end) {
    end = Math.min(buf.length, end)
    var res = []

    var i = start
    while (i < end) {
      var firstByte = buf[i]
      var codePoint = null
      var bytesPerSequence = (firstByte > 0xEF) ? 4
        : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
        : 1

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte
            }
            break
          case 2:
            secondByte = buf[i + 1]
            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint
              }
            }
            break
          case 3:
            secondByte = buf[i + 1]
            thirdByte = buf[i + 2]
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint
              }
            }
            break
          case 4:
            secondByte = buf[i + 1]
            thirdByte = buf[i + 2]
            fourthByte = buf[i + 3]
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint
              }
            }
        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD
        bytesPerSequence = 1
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000
        res.push(codePoint >>> 10 & 0x3FF | 0xD800)
        codePoint = 0xDC00 | codePoint & 0x3FF
      }

      res.push(codePoint)
      i += bytesPerSequence
    }

    return decodeCodePointsArray(res)
  }

  // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety
  var MAX_ARGUMENTS_LENGTH = 0x1000

  function decodeCodePointsArray (codePoints) {
    var len = codePoints.length
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
    }

    // Decode in chunks to avoid "call stack size exceeded".
    var res = ''
    var i = 0
    while (i < len) {
      res += String.fromCharCode.apply(
        String,
        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
      )
    }
    return res
  }

  function asciiSlice (buf, start, end) {
    var ret = ''
    end = Math.min(buf.length, end)

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F)
    }
    return ret
  }

  function latin1Slice (buf, start, end) {
    var ret = ''
    end = Math.min(buf.length, end)

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i])
    }
    return ret
  }

  function hexSlice (buf, start, end) {
    var len = buf.length

    if (!start || start < 0) start = 0
    if (!end || end < 0 || end > len) end = len

    var out = ''
    for (var i = start; i < end; ++i) {
      out += toHex(buf[i])
    }
    return out
  }

  function utf16leSlice (buf, start, end) {
    var bytes = buf.slice(start, end)
    var res = ''
    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
    }
    return res
  }

  Memory.prototype.slice = function slice (start, end) {
    var len = this.length
    start = ~~start
    end = end === undefined ? len : ~~end

    if (start < 0) {
      start += len
      if (start < 0) start = 0
    } else if (start > len) {
      start = len
    }

    if (end < 0) {
      end += len
      if (end < 0) end = 0
    } else if (end > len) {
      end = len
    }

    if (end < start) end = start

    var newBuf = this.subarray(start, end)
    // Return an augmented `Uint8Array` instance
    newBuf.__proto__ = Memory.prototype
    return newBuf
  }

  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */
  function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
  }

  Memory.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) checkOffset(offset, byteLength, this.length)

    var val = this[offset]
    var mul = 1
    var i = 0
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul
    }

    return val
  }

  Memory.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) {
      checkOffset(offset, byteLength, this.length)
    }

    var val = this[offset + --byteLength]
    var mul = 1
    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul
    }

    return val
  }

  Memory.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 1, this.length)
    return this[offset]
  }

  Memory.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    return this[offset] | (this[offset + 1] << 8)
  }

  Memory.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    return (this[offset] << 8) | this[offset + 1]
  }

  Memory.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
  }

  Memory.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
  }

  Memory.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) checkOffset(offset, byteLength, this.length)

    var val = this[offset]
    var mul = 1
    var i = 0
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul
    }
    mul *= 0x80

    if (val >= mul) val -= Math.pow(2, 8 * byteLength)

    return val
  }

  Memory.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) checkOffset(offset, byteLength, this.length)

    var i = byteLength
    var mul = 1
    var val = this[offset + --i]
    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul
    }
    mul *= 0x80

    if (val >= mul) val -= Math.pow(2, 8 * byteLength)

    return val
  }

  Memory.prototype.readInt8 = function readInt8 (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 1, this.length)
    if (!(this[offset] & 0x80)) return (this[offset])
    return ((0xff - this[offset] + 1) * -1)
  }

  Memory.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    var val = this[offset] | (this[offset + 1] << 8)
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  }

  Memory.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    var val = this[offset + 1] | (this[offset] << 8)
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  }

  Memory.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
  }

  Memory.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
  }

  Memory.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)
    return ieee754.read(this, offset, true, 23, 4)
  }

  Memory.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)
    return ieee754.read(this, offset, false, 23, 4)
  }

  Memory.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 8, this.length)
    return ieee754.read(this, offset, true, 52, 8)
  }

  Memory.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 8, this.length)
    return ieee754.read(this, offset, false, 52, 8)
  }

  function checkInt (buf, value, offset, ext, max, min) {
    if (!Memory.isMemory(buf)) throw new TypeError('"buffer" argument must be a Memory instance')
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
  }

  Memory.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
    value = +value
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1
      checkInt(this, value, offset, byteLength, maxBytes, 0)
    }

    var mul = 1
    var i = 0
    this[offset] = value & 0xFF
    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF
    }

    return offset + byteLength
  }

  Memory.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
    value = +value
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1
      checkInt(this, value, offset, byteLength, maxBytes, 0)
    }

    var i = byteLength - 1
    var mul = 1
    this[offset + i] = value & 0xFF
    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF
    }

    return offset + byteLength
  }

  Memory.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
    this[offset] = (value & 0xff)
    return offset + 1
  }

  Memory.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    return offset + 2
  }

  Memory.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
    return offset + 2
  }

  Memory.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
    return offset + 4
  }

  Memory.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
    return offset + 4
  }

  Memory.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) {
      var limit = Math.pow(2, (8 * byteLength) - 1)

      checkInt(this, value, offset, byteLength, limit - 1, -limit)
    }

    var i = 0
    var mul = 1
    var sub = 0
    this[offset] = value & 0xFF
    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
    }

    return offset + byteLength
  }

  Memory.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) {
      var limit = Math.pow(2, (8 * byteLength) - 1)

      checkInt(this, value, offset, byteLength, limit - 1, -limit)
    }

    var i = byteLength - 1
    var mul = 1
    var sub = 0
    this[offset + i] = value & 0xFF
    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
    }

    return offset + byteLength
  }

  Memory.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
    if (value < 0) value = 0xff + value + 1
    this[offset] = (value & 0xff)
    return offset + 1
  }

  Memory.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    return offset + 2
  }

  Memory.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
    return offset + 2
  }

  Memory.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
    return offset + 4
  }

  Memory.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
    if (value < 0) value = 0xffffffff + value + 1
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
    return offset + 4
  }

  function checkIEEE754 (buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
    if (offset < 0) throw new RangeError('Index out of range')
  }

  function writeFloat (buf, value, offset, littleEndian, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
    }
    ieee754.write(buf, value, offset, littleEndian, 23, 4)
    return offset + 4
  }

  Memory.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert)
  }

  Memory.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert)
  }

  function writeDouble (buf, value, offset, littleEndian, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
    }
    ieee754.write(buf, value, offset, littleEndian, 52, 8)
    return offset + 8
  }

  Memory.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert)
  }

  Memory.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert)
  }

  // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
  Memory.prototype.copy = function copy (target, targetStart, start, end) {
    if (!Memory.isMemory(target)) throw new TypeError('argument should be a Memory')
    if (!start) start = 0
    if (!end && end !== 0) end = this.length
    if (targetStart >= target.length) targetStart = target.length
    if (!targetStart) targetStart = 0
    if (end > 0 && end < start) end = start

    // Copy 0 bytes; we're done
    if (end === start) return 0
    if (target.length === 0 || this.length === 0) return 0

    // Fatal error conditions
    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds')
    }
    if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
    if (end < 0) throw new RangeError('sourceEnd out of bounds')

    // Are we oob?
    if (end > this.length) end = this.length
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start
    }

    var len = end - start

    if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
      // Use built-in when available, missing from IE11
      this.copyWithin(targetStart, start, end)
    } else if (this === target && start < targetStart && targetStart < end) {
      // descending copy from end
      for (var i = len - 1; i >= 0; --i) {
        target[i + targetStart] = this[i + start]
      }
    } else {
      Uint8Array.prototype.set.call(
        target,
        this.subarray(start, end),
        targetStart
      )
    }

    return len
  }

  // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])
  Memory.prototype.fill = function fill (val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start
        start = 0
        end = this.length
      } else if (typeof end === 'string') {
        encoding = end
        end = this.length
      }
      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string')
      }
      if (typeof encoding === 'string' && !Memory.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding)
      }
      if (val.length === 1) {
        var code = val.charCodeAt(0)
        if ((encoding === 'utf8' && code < 128) ||
            encoding === 'latin1') {
          // Fast path: If `val` fits into a single byte, use that numeric value.
          val = code
        }
      }
    } else if (typeof val === 'number') {
      val = val & 255
    }

    // Invalid ranges are not set to a default, so can range check early.
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index')
    }

    if (end <= start) {
      return this
    }

    start = start >>> 0
    end = end === undefined ? this.length : end >>> 0

    if (!val) val = 0

    var i
    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val
      }
    } else {
      var bytes = Memory.isMemory(val)
        ? val
        : new Memory(val, encoding)
      var len = bytes.length
      if (len === 0) {
        throw new TypeError('The value "' + val +
          '" is invalid for argument "value"')
      }
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len]
      }
    }

    return this
  }

  // HELPER FUNCTIONS
  // ================

  var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

  function base64clean (str) {
    // Node takes equal signs as end of the Base64 encoding
    str = str.split('=')[0]
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = str.trim().replace(INVALID_BASE64_RE, '')
    // Node converts strings with length < 2 to ''
    if (str.length < 2) return ''
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
      str = str + '='
    }
    return str
  }

  function toHex (n) {
    if (n < 16) return '0' + n.toString(16)
    return n.toString(16)
  }

  function utf8ToBytes (string, units) {
    units = units || Infinity
    var codePoint
    var length = string.length
    var leadSurrogate = null
    var bytes = []

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i)

      // is surrogate component
      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
            continue
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
            continue
          }

          // valid lead
          leadSurrogate = codePoint

          continue
        }

        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        }

        // valid surrogate pair
        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      }

      leadSurrogate = null

      // encode utf8
      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break
        bytes.push(codePoint)
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break
        bytes.push(
          codePoint >> 0x6 | 0xC0,
          codePoint & 0x3F | 0x80
        )
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break
        bytes.push(
          codePoint >> 0xC | 0xE0,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        )
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break
        bytes.push(
          codePoint >> 0x12 | 0xF0,
          codePoint >> 0xC & 0x3F | 0x80,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        )
      } else {
        throw new Error('Invalid code point')
      }
    }

    return bytes
  }

  function asciiToBytes (str) {
    var byteArray = []
    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF)
    }
    return byteArray
  }

  function utf16leToBytes (str, units) {
    var c, hi, lo
    var byteArray = []
    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break

      c = str.charCodeAt(i)
      hi = c >> 8
      lo = c % 256
      byteArray.push(lo)
      byteArray.push(hi)
    }

    return byteArray
  }

  function base64ToBytes (str) {
    return base64.toByteArray(base64clean(str))
  }

  function blitBuffer (src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if ((i + offset >= dst.length) || (i >= src.length)) break
      dst[i + offset] = src[i]
    }
    return i
  }

  // ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
  // but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
  function isArrayBuffer (obj) {
    return obj instanceof ArrayBuffer ||
      (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
        typeof obj.byteLength === 'number')
  }

  function numberIsNaN (obj) {
    return obj !== obj // eslint-disable-line no-self-compare
  }

  return binary.Memory = Memory;

});
define('skylark-langx-binary/buffer',[
  "./memory"
],function(Memory){
  return Memory;
});
define('skylark-langx-binary/get-type-of',[
    "./binary",
    "./memory"
],function(binary,Memory){
     function getTypeOf(input) {
        if (typeof input === 'string') {
            return 'string';
        }
        if (Object.prototype.toString.call(input) === '[object Array]') {
            return 'array';
        }
        if (Memory.isMemory(input)) {
            return 'memory';
        }
        if (input instanceof Uint8Array) {
            return 'uint8array';
        }
        if (input instanceof ArrayBuffer) {
            return 'arraybuffer';
        }
    }
	
	return getTypeOf;	
});
define('skylark-langx-binary/string-to-arraylike',[
  "./binary"
],function(binary){

    function stringToArrayLike(str, array) {
        for (var i = 0; i < str.length; ++i) {
            array[i] = str.charCodeAt(i) & 255;
        }
        return array;
    }

    return binary.stringToArrayLike = stringToArrayLike;
});

define('skylark-langx-binary/arraylike-to-string',[
  "./binary",
  "./get-type-of"
],function(binary,getTypeOf){

    var arrayToStringHelper = {
        stringifyByChunk: function (array, type, chunk) {
            var result = [], k = 0, len = array.length;
            if (len <= chunk) {
                return String.fromCharCode.apply(null, array);
            }
            while (k < len) {
                if (type === 'array' || type === 'nodebuffer') {
                    result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
                } else {
                    result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
                }
                k += chunk;
            }
            return result.join('');
        },
        stringifyByChar: function (array) {
            var resultStr = '';
            for (var i = 0; i < array.length; i++) {
                resultStr += String.fromCharCode(array[i]);
            }
            return resultStr;
        },
        applyCanBeUsed: {
            uint8array: function () {
                try {
                    return support.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
                } catch (e) {
                    return false;
                }
            }(),
            nodebuffer: function () {
                try {
                ///    return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.allocBuffer(1)).length === 1;
                    return support.nodebuffer && String.fromCharCode.apply(null, Buffer.alloc(1)).length === 1;
                } catch (e) {
                    return false;
                }
            }()
        }
    };
    function arrayLikeToString(array) {
        var chunk = 65536, type = getTypeOf(array), canUseApply = true;
        if (type === 'uint8array') {
            canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
        } else if (type === 'memory') {
            canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
        }
        if (canUseApply) {
            while (chunk > 1) {
                try {
                    return arrayToStringHelper.stringifyByChunk(array, type, chunk);
                } catch (e) {
                    chunk = Math.floor(chunk / 2);
                }
            }
        }
        return arrayToStringHelper.stringifyByChar(array);
    }

    return binary.arrayLikeToString = arrayLikeToString;
});

define('skylark-langx-binary/transform',[
    "./binary",
    "./memory",
    "./get-type-of",
    "./string-to-arraylike",
    "./arraylike-to-string"
],function(binary,Memory,getTypeOf,stringToArrayLike,arrayLikeToString){

    function identity(input) {
        return input;
    }

    function arrayLikeToArrayLike(arrayFrom, arrayTo) {
        for (var i = 0; i < arrayFrom.length; i++) {
            arrayTo[i] = arrayFrom[i];
        }
        return arrayTo;
    }

    var transform =  function (outputType, input) {
        if (!input) {
            input = '';
        }
        if (!outputType) {
            return input;
        }
        var inputType = getTypeOf(input);
        var result = transform[inputType][outputType](input);
        return result;
    };
    transform['string'] = {
        'string': identity,
        'array': function (input) {
            return stringToArrayLike(input, new Array(input.length));
        },
        'arraybuffer': function (input) {
            return transform['string']['uint8array'](input).buffer;
        },
        'uint8array': function (input) {
            return stringToArrayLike(input, new Uint8Array(input.length));
        },
        'memory': function (input) {
            ///return stringToArrayLike(input, nodejsUtils.allocBuffer(input.length));
            return stringToArrayLike(input, Buffer.alloc(input.length));
        }
    };
    transform['array'] = {
        'string': arrayLikeToString,
        'array': identity,
        'arraybuffer': function (input) {
            return new Uint8Array(input).buffer;
        },
        'uint8array': function (input) {
            return new Uint8Array(input);
        },
        'memory': function (input) {
            ///return nodejsUtils.newBufferFrom(input);
            return Memory.from(input);
        }
    };
    transform['arraybuffer'] = {
        'string': function (input) {
            return arrayLikeToString(new Uint8Array(input));
        },
        'array': function (input) {
            return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
        },
        'arraybuffer': identity,
        'uint8array': function (input) {
            return new Uint8Array(input);
        },
        'memory': function (input) {
            ///return nodejsUtils.newBufferFrom(new Uint8Array(input));
            return Memory.from(new Uint8Array(input));
        }
    };
    transform['uint8array'] = {
        'string': arrayLikeToString,
        'array': function (input) {
            return arrayLikeToArrayLike(input, new Array(input.length));
        },
        'arraybuffer': function (input) {
            return input.buffer;
        },
        'uint8array': identity,
        'memory': function (input) {
            ///return nodejsUtils.newBufferFrom(input);
            return Memory.from(input);
        }
    };
    transform['memory'] = {
        'string': arrayLikeToString,
        'array': function (input) {
            return arrayLikeToArrayLike(input, new Array(input.length));
        },
        'arraybuffer': function (input) {
            return transform['memory']['uint8array'](input).buffer;
        },
        'uint8array': function (input) {
            return arrayLikeToArrayLike(input, new Uint8Array(input.length));
        },
        'memory': identity
    };

    return binary.transform = transform;
});

define('skylark-langx-constructs/constructs',[
  "skylark-langx-ns"
],function(skylark){

    return skylark.attach("langx.constructs",{});
});
define('skylark-langx-constructs/inherit',[
	"./constructs"
],function(constructs){

    function inherit(ctor,base) {
        ///var f = function() {};
        ///f.prototype = base.prototype;
        ///
        ///ctor.prototype = new f();

	    if ((typeof base !== "function") && base) {
	      throw new TypeError("Super expression must either be null or a function");
	    }

	    ctor.prototype = Object.create(base && base.prototype, {
	      constructor: {
	        value: ctor,
	        writable: true,
	        configurable: true
	      }
	    });

	    if (base) {
	    	//tor.__proto__ = base;
	    	Object.setPrototypeOf(ctor, base);
	    } 
    }

    return constructs.inherit = inherit
});
define('skylark-langx-types/types',[
    "skylark-langx-ns"
],function(skylark){
    var nativeIsArray = Array.isArray, 
        toString = {}.toString;
    
    var type = (function() {
        var class2type = {};

        // Populate the class2type map
        "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" ").forEach(function(name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
        });

        return function type(obj) {
            return obj == null ? String(obj) :
                class2type[toString.call(obj)] || "object";
        };
    })();

 
    var  isArray = nativeIsArray || function(obj) {
        return object && object.constructor === Array;
    };


    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function/string/element and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * isArrayLike([1, 2, 3])
     * // => true
     *
     * isArrayLike(document.body.children)
     * // => false
     *
     * isArrayLike('abc')
     * // => true
     *
     * isArrayLike(Function)
     * // => false
     */    
    function isArrayLike(obj) {
        return !isString(obj) && !isHtmlNode(obj) && typeof obj.length == 'number' && !isFunction(obj);
    }

    /**
     * Checks if `value` is classified as a boolean primitive or object.
     *
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a boolean, else `false`.
     * @example
     *
     * isBoolean(false)
     * // => true
     *
     * isBoolean(null)
     * // => false
     */
    function isBoolean(obj) {
       return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
       //return typeof(obj) === "boolean";
    }

    function isDefined(obj) {
        return typeof obj !== 'undefined';
    }

    function isDocument(obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
    }

   // Is a given value a DOM element?
    function isElement(obj) {
        return !!(obj && obj.nodeType === 1);
    }   

    function isEmptyObject(obj) {
        var name;
        for (name in obj) {
            if (obj[name] !== null) {
                return false;
            }
        }
        return true;
    }


    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * isFunction(parseInt)
     * // => true
     *
     * isFunction(/abc/)
     * // => false
     */
    function isFunction(value) {
        return type(value) == "function";
    }



    function isHtmlNode(obj) {
        return obj && obj.nodeType; // obj instanceof Node; //Consider the elements in IFRAME
    }

    function isInstanceOf( /*Object*/ value, /*Type*/ type) {
        //Tests whether the value is an instance of a type.
        if (value === undefined) {
            return false;
        } else if (value === null || type == Object) {
            return true;
        } else if (typeof value === "number") {
            return type === Number;
        } else if (typeof value === "string") {
            return type === String;
        } else if (typeof value === "boolean") {
            return type === Boolean;
        } else if (typeof value === "string") {
            return type === String;
        } else {
            return (value instanceof type) || (value && value.isInstanceOf ? value.isInstanceOf(type) : false);
        }
    }

    function isNull(obj) {
        return obj === null;
    }

    function isNumber(obj) {
        return typeof obj == 'number';
    }

    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;        
        //return type(obj) == "object";
    }

    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    }

    function isString(obj) {
        return typeof obj === 'string';
    }

    function isWindow(obj) {
        return obj && obj == obj.window;
    }

    function isSameOrigin(href) {
        if (href) {
            var origin = location.protocol + '//' + location.hostname;
            if (location.port) {
                origin += ':' + location.port;
            }
            return href.startsWith(origin);
        }
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ;
       //|| (isObjectLike(value) && objectToString.call(value) == symbolTag); // modified by lwf
    }

    // Is a given variable undefined?
    function isUndefined(obj) {
        return obj === void 0;
    }


    var INFINITY = 1 / 0,
        MAX_SAFE_INTEGER = 9007199254740991,
        MAX_INTEGER = 1.7976931348623157e+308,
        NAN = 0 / 0;

    /** Used to match leading and trailing whitespace. */
    var reTrim = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal = /^0o[0-7]+$/i;

    /** Used to detect unsigned integer values. */
    var reIsUint = /^(?:0|[1-9]\d*)$/;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt = parseInt;

    /**
     * Converts `value` to a finite number.
     *
     * @static
     * @memberOf _
     * @since 4.12.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted number.
     * @example
     *
     * _.toFinite(3.2);
     * // => 3.2
     *
     * _.toFinite(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toFinite(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toFinite('3.2');
     * // => 3.2
     */
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = (value < 0 ? -1 : 1);
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }

    /**
     * Converts `value` to an integer.
     *
     * **Note:** This method is loosely based on
     * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
     *
     * @static
     * @memberOf _
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.toInteger(3.2);
     * // => 3
     *
     * _.toInteger(Number.MIN_VALUE);
     * // => 0
     *
     * _.toInteger(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toInteger('3.2');
     * // => 3
     */
    function toInteger(value) {
      var result = toFinite(value),
          remainder = result % 1;

      return result === result ? (remainder ? result - remainder : result) : 0;
    }   

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }





    return skylark.attach("langx.types",{

        isArray: isArray,

        isArrayLike: isArrayLike,

        isBoolean: isBoolean,

        isDefined: isDefined,

        isDocument: isDocument,

        isElement,

        isEmpty : isEmptyObject,

        isEmptyObject: isEmptyObject,

        isFunction: isFunction,

        isHtmlNode: isHtmlNode,

        isInstanceOf,

        isNaN : function (obj) {
            return isNaN(obj);
        },

        isNull: isNull,


        isNumber: isNumber,

        isNumeric: isNumber,

        isObject: isObject,

        isPlainObject: isPlainObject,

        isString: isString,

        isSameOrigin: isSameOrigin,

        isSymbol : isSymbol,

        isUndefined: isUndefined,

        isWindow: isWindow,

        type: type,

        toFinite : toFinite,
        toNumber : toNumber,
        toInteger : toInteger
        
    });

});
define('skylark-langx-types/main',[
	"./types"
],function(types){
	return types;
});
define('skylark-langx-types', ['skylark-langx-types/main'], function (main) { return main; });

define('skylark-langx-objects/objects',[
    "skylark-langx-ns",
    "skylark-langx-types"
],function(skylark,types){

    return skylark.attach("langx.objects",{
        attach : skylark.attach
    });

});
define('skylark-langx-objects/all-keys',[
    "skylark-langx-types",
    "./objects"
],function(types,objects){

    // Retrieve all the property names of an object.
    function allKeys(obj) {
        if (!types.isObject(obj)) return [];
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
    }

    return objects.allKeys = allKeys;

});
define('skylark-langx-objects/assign',[
	"skylark-langx-types",
	"./objects"
],function(types,objects) {

	return objects.assign = Object.assign;
});
define('skylark-langx-objects/to-key',[
	"skylark-langx-types",
	"./objects"
],function(types,objects) {

	const isSymbol = types.isSymbol,
		  isString = types.isString;

	/** Used as references for various `Number` constants. */
	const INFINITY = 1 / 0

	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */
	function toKey(value) {
	  if (isString(value) || isSymbol(value)) {
	    return value
	  }
	  const result = `${value}`
	  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result
	}

	return objects.toKey = toKey;

});
define('skylark-langx-objects/is-key',[
	"skylark-langx-types",
	"./objects"
],function(types,objects) {

	const isSymbol = types.isSymbol,
		  isArray = types.isArray;

	/** Used to match property names within property paths. */
	const reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/
	const reIsPlainProp = /^\w*$/

	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */
	function isKey(value, object) {
	  if (isArray(value)) {
	    return false
	  }
	  const type = typeof value
	  if (type === 'number' || type === 'boolean' || value == null || isSymbol(value)) {
	    return true
	  }
	  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
	    (object != null && value in Object(object))
	}

	return objects.isKey = isKey;
});
define('skylark-langx-objects/_cast_path',[
	"skylark-langx-types",
	"./objects",
	"./is-key"
],function(types,objects,isKey) {
	const charCodeOfDot = '.'.charCodeAt(0)
	const reEscapeChar = /\\(\\)?/g
	const rePropName = RegExp(
	  // Match anything that isn't a dot or bracket.
	  '[^.[\\]]+' + '|' +
	  // Or match property names within brackets.
	  '\\[(?:' +
	    // Match a non-string expression.
	    '([^"\'][^[]*)' + '|' +
	    // Or match strings (supports escaping characters).
	    '(["\'])((?:(?!\\2)[^\\\\]|\\\\.)*?)\\2' +
	  ')\\]'+ '|' +
	  // Or match "" as the space between consecutive dots or empty brackets.
	  '(?=(?:\\.|\\[\\])(?:\\.|\\[\\]|$))'
	  , 'g')

	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */
	const stringToPath = ((string) => {
	  const result = []
	  if (string.charCodeAt(0) === charCodeOfDot) {
	    result.push('')
	  }
	  string.replace(rePropName, (match, expression, quote, subString) => {
	    let key = match
	    if (quote) {
	      key = subString.replace(reEscapeChar, '$1')
	    }
	    else if (expression) {
	      key = expression.trim()
	    }
	    result.push(key)
	  })
	  return result
	});

	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {Array} Returns the cast property path array.
	 */
	function castPath(value, object) {
	  if (types.isArray(value)) {
	    return value
	  }
	  return isKey(value, object) ? [value] : stringToPath(value)
	}

	return castPath;
});
define('skylark-langx-objects/get',[
	"skylark-langx-types",
	"./objects",
	"./to-key",
	"./_cast_path"
],function(types,objects,toKey,castPath) {

	/**
	 * The base implementation of `get` without support for default values.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @returns {*} Returns the resolved value.
	 */
	function baseGet(object, path) {
	  path = castPath(path, object)

	  let index = 0
	  const length = path.length

	  while (object != null && index < length) {
	    object = object[toKey(path[index++])]
	  }
	  return (index && index == length) ? object : undefined
	}


	/**
	 * Gets the value at `path` of `object`. If the resolved value is
	 * `undefined`, the `defaultValue` is returned in its place.
	 *
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
	 * @returns {*} Returns the resolved value.
	 * @see has, hasIn, set, unset
	 * @example
	 *
	 * const object = { 'a': [{ 'b': { 'c': 3 } }] }
	 *
	 * get(object, 'a[0].b.c')
	 * // => 3
	 *
	 * get(object, ['a', '0', 'b', 'c'])
	 * // => 3
	 *
	 * get(object, 'a.b.c', 'default')
	 * // => 'default'
	 */
	function get(object, path, defaultValue) {
	  const result = object == null ? undefined : baseGet(object, path)
	  return result === undefined ? defaultValue : result
	}

	return objects.get = get;
});
define('skylark-langx-objects/base-at',[
	"./objects",
	"./get"
],function(objects,get) {

	/**
	 * The base implementation of `at` without support for individual paths.
	 *
	 * @param {Object} object The object to iterate over.
	 * @param {string[]} paths The property paths to pick.
	 * @returns {Array} Returns the picked elements.
	 */
	function baseAt(object, paths) {
	  let index = -1
	  const length = paths.length
	  const result = new Array(length)
	  const skip = object == null

	  while (++index < length) {
	    result[index] = skip ? undefined : get(object, paths[index])
	  }
	  return result
	}

	return objects.baseAt = baseAt;
});
define('skylark-langx-objects/clone',[
    "skylark-langx-types",
    "./objects"
],function(types,objects) {
    var isPlainObject = types.isPlainObject,
        isArray = types.isArray;

    function clone( /*anything*/ src,checkCloneMethod) {
        var copy;
        if (src === undefined || src === null) {
            copy = src;
        } else if (checkCloneMethod && src.clone) {
            copy = src.clone();
        } else if (isArray(src)) {
            copy = [];
            for (var i = 0; i < src.length; i++) {
                copy.push(clone(src[i]));
            }
        } else if (isPlainObject(src)) {
            copy = {};
            for (var key in src) {
                copy[key] = clone(src[key]);
            }
        } else {
            copy = src;
        }

        return copy;

    }

    return objects.clone = clone;
});
define('skylark-langx-objects/defaults',[
    "./objects",
    "./all-keys"
],function(objects,allKeys){
  // An internal function for creating assigner functions.
  function createAssigner(keysFunc, defaults) {
      return function(obj) {
        var length = arguments.length;
        if (defaults) obj = Object(obj);  
        if (length < 2 || obj == null) return obj;
        for (var index = 1; index < length; index++) {
          var source = arguments[index],
              keys = keysFunc(source),
              l = keys.length;
          for (var i = 0; i < l; i++) {
            var key = keys[i];
            if (!defaults || obj[key] === void 0) obj[key] = source[key];
          }
        }
        return obj;
     };
  }
  
  return objects.defaults = createAssigner(allKeys, true);
});
define('skylark-langx-objects/each',[
    "./objects"
],function(objects) {

    function each(obj, callback,isForEach) {
        var length, key, i, undef, value;

        if (obj) {
            length = obj.length;

            if (length === undef) {
                // Loop object items
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        value = obj[key];
                        if ((isForEach ? callback.call(value, value, key) : callback.call(value, key, value) ) === false) {
                            break;
                        }
                    }
                }
            } else {
                // Loop array items
                for (i = 0; i < length; i++) {
                    value = obj[i];
                    if ((isForEach ? callback.call(value, value, i) : callback.call(value, i, value) )=== false) {
                        break;
                    }
                }
            }
        }

        return this;
    }

    return objects.each = each;
});
define('skylark-langx-objects/_mixin',[
    "skylark-langx-types",
    "./objects"
],function(types,objects) {

    var isPlainObject = types.isPlainObject;

    function _mixin(target, source, deep, safe) {
        for (var key in source) {
            //if (!source.hasOwnProperty(key)) {
            //    continue;
            //}
            if (safe && target[key] !== undefined) {
                continue;
            }
            // if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
            //    if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
            if (deep && isPlainObject(source[key])) {
                if (!isPlainObject(target[key])) {
                    target[key] = {};
                }
                //if (isArray(source[key]) && !isArray(target[key])) {
                //    target[key] = [];
                //}
                _mixin(target[key], source[key], deep, safe);
            } else if (source[key] !== undefined) {
                target[key] = source[key]
            }
        }
        return target;
    }

    return _mixin;
});
define('skylark-langx-objects/_parse_mixin_args',[
    "skylark-langx-types",
    "./objects"
],function(types,objects) {

    var slice = Array.prototype.slice,
        isBoolean = types.isBoolean;

    function _parseMixinArgs(args) {
        var params = slice.call(arguments, 0),
            target = params.shift(),
            deep = false;
        if (isBoolean(params[params.length - 1])) {
            deep = params.pop();
        }

        return {
            target: target,
            sources: params,
            deep: deep
        };
    }
    
    return _parseMixinArgs;
});
define('skylark-langx-objects/mixin',[
	"skylark-langx-types",
	"./objects",
  "./_mixin",
  "./_parse_mixin_args"
],function(types,objects,_mixin,_parseMixinArgs) {


    function mixin() {
        var args = _parseMixinArgs.apply(this, arguments);

        args.sources.forEach(function(source) {
            _mixin(args.target, source, args.deep, false);
        });
        return args.target;
    }


    return objects.mixin = mixin;
	
});
define('skylark-langx-objects/extend',[
    "./objects",
    "./mixin"
],function(objects,mixin) {
    var slice = Array.prototype.slice;

    function extend(target) {
        var deep, args = slice.call(arguments, 1);
        if (typeof target == 'boolean') {
            deep = target
            target = args.shift()
        }
        if (args.length == 0) {
            args = [target];
            target = this;
        }
        args.forEach(function(arg) {
            mixin(target, arg, deep);
        });
        return target;
    }

    return objects.extend = extend;
});
define('skylark-langx-objects/for-each',[
 	"./objects",
 	"./each"
],function(objects,each){

    function forEach (obj, fn) {
    	if (!obj) {
    		return;
    	}
     	if (obj.forEach) {
     		obj.forEach(fn);
     	} else {
     		each(obj,fn,true);
     	}
    }

	return objects.forEach = forEach;
});
define('skylark-langx-objects/has',[
    "skylark-langx-types",
    "./objects"
],function(types,objects){
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    function has(obj, path) {
        if (!types.isArray(path)) {
            return obj != null && hasOwnProperty.call(obj, path);
        }
        var length = path.length;
        for (var i = 0; i < length; i++) {
            var key = path[i];
            if (obj == null || !hasOwnProperty.call(obj, key)) {
                return false;
            }
            obj = obj[key];
        }
        return !!length;
    }

    return objects.has = has;
});
define('skylark-langx-objects/includes',[
    "./objects"
],function(objects) {

    /**
     * Checks if `value` is in `collection`. If `collection` is a string, it's
     * checked for a substring of `value`, otherwise
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * is used for equality comparisons. If `fromIndex` is negative, it's used as
     * the offset from the end of `collection`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
     * @returns {boolean} Returns `true` if `value` is found, else `false`.
     * @example
     *
     * _.includes([1, 2, 3], 1);
     * // => true
     *
     * _.includes([1, 2, 3], 1, 2);
     * // => false
     *
     * _.includes({ 'a': 1, 'b': 2 }, 1);
     * // => true
     *
     * _.includes('abcd', 'bc');
     * // => true
     */
    function includes(collection, value, fromIndex, guard) {
      collection = isArrayLike(collection) ? collection : values(collection);
      fromIndex = (fromIndex && !guard) ? toInteger(fromIndex) : 0;

      var length = collection.length;
      if (fromIndex < 0) {
        fromIndex = nativeMax(length + fromIndex, 0);
      }
      return isString(collection)
        ? (fromIndex <= length && collection.indexOf(value, fromIndex) > -1)
        : (!!length && baseIndexOf(collection, value, fromIndex) > -1);
    }



    return objects.includes = includes;
});
define('skylark-langx-objects/is-equal',[
	"skylark-langx-types",
	"./objects"
],function(types,objects) {
    var isFunction = types.isFunction;


    // Internal recursive comparison function for `isEqual`.
    var eq, deepEq;
    var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

    eq = function(a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        // `null` or `undefined` only equal to itself (strict comparison).
        if (a == null || b == null) return false;
        // `NaN`s are equivalent, but non-reflexive.
        if (a !== a) return b !== b;
        // Exhaust primitive checks
        var type = typeof a;
        if (type !== 'function' && type !== 'object' && typeof b != 'object') return false;
        return deepEq(a, b, aStack, bStack);
    };

    // Internal recursive comparison function for `isEqual`.
    deepEq = function(a, b, aStack, bStack) {
        // Unwrap any wrapped objects.
        //if (a instanceof _) a = a._wrapped;
        //if (b instanceof _) b = b._wrapped;
        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className !== toString.call(b)) return false;
        switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                return '' + a === '' + b;
            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN.
                if (+a !== +a) return +b !== +b;
                // An `egal` comparison is performed for other numeric values.
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;
            case '[object Symbol]':
                return SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b);
        }

        var areArrays = className === '[object Array]';
        if (!areArrays) {
            if (typeof a != 'object' || typeof b != 'object') return false;
            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor &&
                               isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

        // Initializing stack of traversed objects.
        // It's done here since we only need them for objects and arrays comparison.
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a) return bStack[length] === b;
        }

        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        // Recursively compare objects and arrays.
        if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            length = a.length;
            if (length !== b.length) return false;
            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
                if (!eq(a[length], b[length], aStack, bStack)) return false;
            }
        } else {
            // Deep compare objects.
            var keys = Object.keys(a), key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            if (Object.keys(b).length !== length) return false;
            while (length--) {
                // Deep compare each member
                key = keys[length];
                if (!(b[key]!==undefined && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return true;
    };


   // Perform a deep comparison to check if two objects are equal.
    function isEqual(a, b) {
        return eq(a, b);
    }

    return objects.isEqual = isEqual;
	
});
define('skylark-langx-objects/keys',[
    "skylark-langx-types",
    "./objects",
    "./has"
],function(types,objects,has){

    // Retrieve the names of an object's own properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`.
    function keys(obj) {
        if (!types.isObject(obj)) return [];  
        var keys = [];
        for (var key in obj) if (has(obj, key)) keys.push(key);
        return keys;
    }

    return objects.keys = keys;
});
define('skylark-langx-objects/is-match',[
    "skylark-langx-types",
    "./objects",
    "./keys"
],function(types,objects,keys) {

    // Returns whether an object has a given set of `key:value` pairs.
    function isMatch(object, attrs) {
        var keys = keys(attrs), length = keys.length;
        if (object == null) return !length;
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
          var key = keys[i];
          if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;
    }    

    return objects.isMatch = isMatch;
});
define('skylark-langx-objects/omit',[
    "./objects",
    "./mixin"
],function(objects,mixin) {

   // Return a copy of the object without the blacklisted properties.
    function omit(obj, prop1,prop2) {
        if (!obj) {
            return null;
        }
        var result = mixin({},obj);
        for(var i=1;i<arguments.length;i++) {
            var pn = arguments[i];
            if (pn in obj) {
                delete result[pn];
            }
        }
        return result;

    }
    
    return objects.omit = omit;
});
define('skylark-langx-objects/pick',[
    "./objects"
],function(objects) {

   // Return a copy of the object only containing the whitelisted properties.
    function pick(obj,prop1,prop2) {
        if (!obj) {
            return null;
        }
        var result = {};
        for(var i=1;i<arguments.length;i++) {
            var pn = arguments[i];
            if (pn in obj) {
                result[pn] = obj[pn];
            }
        }
        return result;
    }
    
    return objects.pick = pick;
});
define('skylark-langx-objects/remove-items',[
    "skylark-langx-types",
    "./objects"
],function(types,objects){
    function removeItem(items, item) {
        if (types.isArray(items)) {
            var idx = items.indexOf(item);
            if (idx != -1) {
                items.splice(idx, 1);
            }
        } else if (types.isPlainObject(items)) {
            for (var key in items) {
                if (items[key] == item) {
                    delete items[key];
                    break;
                }
            }
        }

        return this;
    }

    return objects.removeItem = removeItem;
});
define('skylark-langx-objects/result',[
  "skylark-langx-types",
  "./objects",
  "./to-key",
  "./_cast_path"
],function(types,objects,toKey,castPath) {
	var isArray = types.isArray,
		isFunction = types.isFunction;

  /**
   * This method is like `get` except that if the resolved value is a
   * function it's invoked with the `this` binding of its parent object and
   * its result is returned.
   *
   * @since 0.1.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to resolve.
   * @param {*} [defaultValue] The value returned for `undefined` resolved values.
   * @returns {*} Returns the resolved value.
   * @example
   *
   * const object = { 'a': [{ 'b': { 'c1': 3, 'c2': () => 4 } }] }
   *
   * result(object, 'a[0].b.c1')
   * // => 3
   *
   * result(object, 'a[0].b.c2')
   * // => 4
   *
   * result(object, 'a[0].b.c3', 'default')
   * // => 'default'
   *
   * result(object, 'a[0].b.c3', () => 'default')
   * // => 'default'
   */
  function result(object, path, defaultValue) {
    path = castPath(path, object)

    let index = -1
    let length = path.length

    // Ensure the loop is entered when path is empty.
    if (!length) {
      length = 1
      object = undefined
    }
    while (++index < length) {
      let value = object == null ? undefined : object[toKey(path[index])]
      if (value === undefined) {
        index = length
        value = defaultValue
      }
      object = isFunction(value) ? value.call(object) : value
    }
    return object
  }

  return objects.result = result;	
});
define('skylark-langx-objects/safe-mixin',[
	"./objects",
  "./_mixin",
  "./_parse_mixin_args"
],function(objects,_mixin,_parseMixinArgs) {

    function safeMixin() {
        var args = _parseMixinArgs.apply(this, arguments);

        args.sources.forEach(function(source) {
            _mixin(args.target, source, args.deep, true);
        });
        return args.target;
    }

    return objects.safeMixin = safeMixin;
});
define('skylark-langx-objects/scall',[
    "./objects"
],function(objects) {
    const  slice = Array.prototype.slice;

    function scall(obj,method,arg1,arg2) {
        if (obj && obj[method]) {
            var args = slice.call(arguments, 2);

            return obj[method].apply(obj,args);
        }
    }

    return objects.scall = scall;
});
define('skylark-langx-objects/is-index',[
	"skylark-langx-types",
	"./objects"
],function(types,objects) {
	/** Used as references for various `Number` constants. */
	const MAX_SAFE_INTEGER = 9007199254740991

	/** Used to detect unsigned integer values. */
	const reIsUint = /^(?:0|[1-9]\d*)$/

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  const type = typeof value
	  length = length == null ? MAX_SAFE_INTEGER : length

	  return !!length &&
	    (type === 'number' ||
	      (type !== 'symbol' && reIsUint.test(value))) &&
	        (value > -1 && value % 1 == 0 && value < length)
	}

	return objects.isIndex = isIndex;
});
define('skylark-langx-objects/set',[
	"skylark-langx-types",
	"./objects",
	"./_cast_path",
	"./is-index",
	"./to-key"
],function(types,objects,castPath,isIndex,toKey) {
	/**
	 * The base implementation of `set`.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @param {Function} [customizer] The function to customize path creation.
	 * @returns {Object} Returns `object`.
	 */
	function baseSet(object, path, value, customizer) {
	  if (!types.isObject(object)) {
	    return object
	  }
	  path = castPath(path, object)

	  const length = path.length
	  const lastIndex = length - 1

	  let index = -1
	  let nested = object

	  while (nested != null && ++index < length) {
	    const key = toKey(path[index])
	    let newValue = value

	    if (index != lastIndex) {
	      const objValue = nested[key]
	      newValue = customizer ? customizer(objValue, key, nested) : undefined
	      if (newValue === undefined) {
	        newValue = types.isObject(objValue)
	          ? objValue
	          : (isIndex(path[index + 1]) ? [] : {})
	      }
	    }
	    nested[key] = newValue; //  assignValues() lwf
	    nested = nested[key];
	  }
	  return object
	}

	/**
	 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
	 * it's created. Arrays are created for missing index properties while objects
	 * are created for all other missing properties. Use `setWith` to customize
	 * `path` creation.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns `object`.
	 * @see has, hasIn, get, unset
	 * @example
	 *
	 * const object = { 'a': [{ 'b': { 'c': 3 } }] }
	 *
	 * set(object, 'a[0].b.c', 4)
	 * console.log(object.a[0].b.c)
	 * // => 4
	 *
	 * set(object, ['x', '0', 'y', 'z'], 5)
	 * console.log(object.x[0].y.z)
	 * // => 5
	 */
	function set(object, path, value) {
	  return object == null ? object : baseSet(object, path, value)
	}


	return objects.set = set;

});
 define('skylark-langx-objects/shadow',[
	"./objects"
],function(objects) {

    function shadow(obj, prop, value) {
        Object.defineProperty(obj, prop, {
            value,
            enumerable: true,
            configurable: true,
            writable: false
        });
        return value;
    }

    return objects.shadow = shadow;
});
define('skylark-langx-objects/unset',[
	"skylark-langx-types",
	"./objects",
	"./set"
],function(types,objects,set) {

	/**
	 * Removes the property at `path` of `object`.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @since 4.0.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to unset.
	 * @returns {boolean} Returns `true` if the property is deleted, else `false`.
	 * @see get, has, set
	 * @example
	 *
	 * const object = { 'a': [{ 'b': { 'c': 7 } }] }
	 * unset(object, 'a[0].b.c')
	 * // => true
	 *
	 * console.log(object)
	 * // => { 'a': [{ 'b': {} }] }
	 *
	 * unset(object, ['a', '0', 'b', 'c'])
	 * // => true
	 *
	 * console.log(object)
	 * // => { 'a': [{ 'b': {} }] }
	 */
	function unset(object, path) {
	  return object == null ? true : set(object, path,undefined)
	}

	return objects.unset = unset;
});
define('skylark-langx-objects/values',[
    "skylark-langx-types",
    "./objects",
    "./all-keys"
],function(types,objects,allKeys){
    // Retrieve the values of an object's properties.
    function values(obj) {
        var keys = allKeys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    }

    return objects.values = values;
});
define('skylark-langx-objects/main',[
	"./objects",
	"./all-keys",
	"./assign",
	"./base-at",
	"./clone",
	"./defaults",
	"./each",
	"./extend",
	"./for-each",
	"./get",
	"./has",
	"./includes",
	"./is-equal",
	"./is-key",
	"./is-match",
	"./keys",
	"./mixin",
	"./omit",
	"./pick",
	"./remove-items",
	"./result",
	"./safe-mixin",
	"./scall",
	"./set",
	"./shadow",
	"./to-key",
	"./unset",
	"./values"
],function(objects){
	return objects;
});
define('skylark-langx-objects', ['skylark-langx-objects/main'], function (main) { return main; });

define('skylark-langx-arrays/arrays',[
  "skylark-langx-ns"
],function(skylark){
    return skylark.attach("langx.arrays");
});
define('skylark-langx-arrays/base-find-index',[
  "./arrays"
],function(arrays){
    /**
     * The base implementation of `_.findIndex` and `_.findLastIndex` without
     * support for iteratee shorthands.
     *
     * @param {Array} array The array to inspect.
     * @param {Function} predicate The function invoked per iteration.
     * @param {number} fromIndex The index to search from.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length,
          index = fromIndex + (fromRight ? 1 : -1);

      while ((fromRight ? index-- : ++index < length)) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    return arrays.baseFindIndex = baseFindIndex;
});
define('skylark-langx-arrays/base-indexof',[
  "./arrays",
  "./base-find-index"
],function(arrays,baseFindIndex){

    /**
     * The base implementation of `isNaN` without support for number objects.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     */
    function baseIsNaN(value) {
      return value !== value;
    }

    /**
     * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
     *
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseIndexOf(array, value, fromIndex) {
      if (value !== value) {
        return baseFindIndex(array, baseIsNaN, fromIndex);
      }
      var index = fromIndex - 1,
          length = array.length;

      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }
	
	return arrays.baseIndexOf = baseIndexOf;
});
define('skylark-langx-arrays/filter',[
  "./arrays"
],function(arrays){
   var _filter = Array.prototype.filter;
 
    function filter(array,func) {
      return _filter.call(array,func);
    }

    return arrays.filter = filter;
	
});
define('skylark-langx-arrays/compact',[
  "./arrays",
  "./filter"
],function(arrays,filter){

    function compact(array) {
        return filter(array, function(item) {
            return item != null;
        });
    }

    return arrays.compact = compact;
});
define('skylark-langx-arrays/in-array',[
  "./arrays"
],function(arrays){
    function inArray(item, array) {
        if (!array) {
            return -1;
        }
        var i;

        if (array.indexOf) {
            return array.indexOf(item);
        }

        i = array.length;
        while (i--) {
            if (array[i] === item) {
                return i;
            }
        }

        return -1;
    }

    return arrays.inArray = inArray;
	
});
define('skylark-langx-arrays/contains',[
  "./arrays",
  "./in-array"
],function(arrays,inArray){

    function contains(array,item) {
      return inArray(item,array);
    }
	
	return arrays.contains = contains;
});
define('skylark-langx-funcs/funcs',[
  "skylark-langx-ns",
],function(skylark,types,objects){
        



    function noop() {
    }




    return skylark.attach("langx.funcs",{
        noop : noop,

        returnTrue: function() {
            return true;
        },

        returnFalse: function() {
            return false;
        }

    });
});
define('skylark-langx-funcs/rest-arguments',[
	"./funcs"
],function(funcs){

  // Some functions take a variable number of arguments, or a few expected
  // arguments at the beginning and then a variable number of values to operate
  // on. This helper accumulates all remaining arguments past the function’s
  // argument length (or an explicit `startIndex`), into an array that becomes
  // the last argument. Similar to ES6’s "rest parameter".
  function restArguments(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length - startIndex, 0),
          rest = Array(length),
          index = 0;
      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  }

  return funcs.restArguments = restArguments;	
});
define('skylark-langx-funcs/bind-all',[
	"./funcs",
	"./rest-arguments"
],function(funcs,restArguments){

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  return funcs.bindAll = restArguments(function(obj, keys) {
    ///keys = flatten(keys, false, false);
    var index = keys.length;
    if (index < 1) throw new Error('bindAll must be passed function names');
    while (index--) {
      var key = keys[index];
      obj[key] = obj[key].bind(obj);
    }
  });

});

define('skylark-langx-funcs/defer',[
    "skylark-langx-types",
    "./funcs"
],function(types,funcs){

    function defer(fn,trigger,args,context) {
        var ret = {
            cancel : null
        },
        fn1 = fn;

        if (!types.isNumber(trigger) && !types.isFunction(trigger)) {
            context = args;
            args = trigger;
            trigger = 0;
        }

        if (args) {
            fn1 = function() {
                fn.apply(context,args);
            };
        }

        if (types.isFunction(trigger)) {
            var canceled = false;
            trigger(function(){
                if (!canceled) {
                    fn1();
                }
            });

            ret.cancel = function() {
                canceled = true;
            }

        } else {
            var  id;
            if (trigger == 0 && requestAnimationFrame) {
                id = requestAnimationFrame(fn1);
                ret.cancel = function() {
                    return cancelAnimationFrame(id);
                };
            } else {
                id = setTimeout(fn1,trigger);
                ret.cancel = function() {
                    return clearTimeout(id);
                };
            }            
        }

        return ret;
    }

    return funcs.defer = defer;
});
define('skylark-langx-funcs/debounce',[
	"./funcs",
    "./defer"
],function(funcs,defer){
   
    function debounce(fn, wait,useAnimationFrame) {
        var timeout,
            defered,
            debounced = function () {
                var context = this, args = arguments;
                var later = function () {
                    timeout = null;
                    if (useAnimationFrame) {
                        defered = defer(fn,args,context);
                    } else {
                        fn.apply(context, args);
                    }
                };

                cancel();
                timeout = setTimeout(later, wait);

                return {
                    cancel 
                };
            },
            cancel = debounced.cancel = function () {
                if (timeout) {
                    clearTimeout(timeout);
                }
                if (defered) {
                    defered.cancel();
                }
                timeout = void 0;
                defered = void 0;
            };

        return debounced;
    }

    return funcs.debounce = debounce;

});
define('skylark-langx-funcs/delegate',[
  "skylark-langx-objects",
  "./funcs"
],function(objects,funcs){
	var mixin = objects.mixin;

    var delegate = (function() {
        // boodman/crockford delegation w/ cornford optimization
        function TMP() {}
        return function(obj, props) {
            TMP.prototype = obj;
            var tmp = new TMP();
            TMP.prototype = null;
            if (props) {
                mixin(tmp, props);
            }
            return tmp; // Object
        };
    })();

    return funcs.delegate = delegate;

});
define('skylark-langx-funcs/loop',[
	"./funcs"
],function(funcs){

	/**
	 * Animation timer is a special type of timer that uses the requestAnimationFrame method.
	 *
	 * This timer calls the method with the same rate as the screen refesh rate.
	 * 
	 * Loop time can be changed dinamically.
	 *
	 * @class AnimationTimer
	 * @param {Function} callback Timer callback function.
	 */
	function AnimationTimer(callback)
	{
		this.callback = callback;

		this.running = false;
		this.id = -1;
	}

	/**
	 * Start timer, is the timer is already running dosen't do anything.
	 * 
	 * @method start
	 */
	AnimationTimer.prototype.start = function()
	{
		if(this.running)
		{
			return;
		}

		this.running = true;

		var self = this;
		function run()
		{
			self.callback();

			if(self.running)
			{
				self.id = requestAnimationFrame(run);
			}
		}

		run();
	};

	/**
	 * Stop animation timer.
	 * 
	 * @method stop
	 */
	AnimationTimer.prototype.stop = function()
	{
		this.running = false;
		cancelAnimationFrame(this.id);
	};

	function loop(fn) {
		return new AnimationTimer(fn);
    }

    return funcs.loop = loop;
});
define('skylark-langx-funcs/negate',[
	"./funcs"
],function(funcs){
   
    /**
     * Creates a function that negates the result of the predicate `func`. The
     * `func` predicate is invoked with the `this` binding and arguments of the
     * created function.
     * @category Function
     * @param {Function} predicate The predicate to negate.
     * @returns {Function} Returns the new negated function.
     * @example
     *
     * function isEven(n) {
     *   return n % 2 == 0
     * }
     *
     * filter([1, 2, 3, 4, 5, 6], negate(isEven))
     * // => [1, 3, 5]
     */
    function negate(predicate) {
      if (typeof predicate !== 'function') {
        throw new TypeError('Expected a function')
      }
      return function(...args) {
        return !predicate.apply(this, args)
      }
    }


    return funcs.negate = negate;

});
define('skylark-langx-funcs/proxy',[
  "skylark-langx-types",
	"./funcs"
],function(types,funcs){
    var slice = Array.prototype.slice,
        isFunction = types.isFunction,
        isString = types.isString;

    function proxy(fn, context) {
        var args = (2 in arguments) && slice.call(arguments, 2)
        if (isFunction(fn)) {
            var proxyFn = function() {
                return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
            }
            return proxyFn;
        } else if (isString(context)) {
            if (args) {
                args.unshift(fn[context], fn)
                return proxy.apply(null, args)
            } else {
                return proxy(fn[context], fn);
            }
        } else {
            throw new TypeError("expected function");
        }
    }

    return funcs.bind = funcs.proxy = proxy;

});
define('skylark-langx-funcs/template',[
  "skylark-langx-objects",
  "./funcs",
  "./proxy"
],function(objects,funcs,proxy){
    //ref : underscore
    var slice = Array.prototype.slice;
   
    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    var templateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /(.)^/;


    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
      "'":      "'",
      '\\':     '\\',
      '\r':     'r',
      '\n':     'n',
      '\t':     't',
      '\u2028': 'u2028',
      '\u2029': 'u2029'
    };

    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;


    function template(text, data, settings) {
        var render;
        settings = objects.defaults({}, settings,templateSettings);

        // Combine delimiters into one regular expression via alternation.
        var matcher = RegExp([
          (settings.escape || noMatch).source,
          (settings.interpolate || noMatch).source,
          (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
          source += text.slice(index, offset)
              .replace(escaper, function(match) { return '\\' + escapes[match]; });

          if (escape) {
            source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
          }
          if (interpolate) {
            source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
          }
          if (evaluate) {
            source += "';\n" + evaluate + "\n__p+='";
          }
          index = offset + match.length;
          return match;
        });
        source += "';\n";

        // If a variable is not specified, place data values in local scope.
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
          "print=function(){__p+=__j.call(arguments,'');};\n" +
          source + 'return __p;\n';

        try {
          render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
          e.source = source;
          throw e;
        }

        if (data) {
          return render(data,this)
        }
        var template = proxy(function(data) {
          return render.call(this, data,this);
        },this);

        // Provide the compiled source as a convenience for precompilation.
        var argument = settings.variable || 'obj';
        template.source = 'function(' + argument + '){\n' + source + '}';

        return template;
    }

    template.templateSettings = funcs.templateSettings = templateSettings;

    return funcs.template = template;

});
define('skylark-langx-funcs/throttle',[
  "./funcs"
],function(funcs){

    const throttle = function (fn, wait) {
        let last = window.performance.now();
        const throttled = function (...args) {
            const now = window.performance.now();
            if (now - last >= wait) {
                fn(...args);
                last = now;
            }
        };
        return throttled;
    };

    /*
    function throttle(func, delay) {
        var timer = null;

        return function() {
            var context = this,
                args = arguments;

            if ( timer === null ) {
                timer = setTimeout(function() {
                    func.apply(context, args);
                    timer = null;
                }, delay);
            }
        };
    }
    */


    return funcs.throttle = throttle;
});
define('skylark-langx-funcs/main',[
	"./funcs",
	"./bind-all",
	"./debounce",
	"./defer",
	"./delegate",
	"./loop",
	"./negate",
	"./proxy",
	"./rest-arguments",
	"./template",
	"./throttle"
],function(funcs){
	return funcs;
});
define('skylark-langx-funcs', ['skylark-langx-funcs/main'], function (main) { return main; });

define('skylark-langx-arrays/flatten',[
  "skylark-langx-types",
  "./arrays"
],function(types,arrays){

    function flatten(array) {
        if (types.isArrayLike(array)) {
            var result = [];
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                if (types.isArrayLike(item)) {
                    for (var j = 0; j < item.length; j++) {
                        result.push(item[j]);
                    }
                } else {
                    result.push(item);
                }
            }
            return result;
        } else {
            return array;
        }
        //return array.length > 0 ? concat.apply([], array) : array;
    }

    return arrays.flatten = flatten;
});
define('skylark-langx-arrays/difference',[
  "skylark-langx-funcs",
  "./arrays",
  "./flatten",
  "./filter",
  "./contains"
],function(funcs,arrays,flatten,filter,contains){
   // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.
    var difference  = funcs.restArguments(function(array, rest) {
      rest = flatten(rest, true, true);
      return filter(array, function(value){
        return !contains(rest, value);
      });
    });

    return arrays.difference = difference;
	
});
define('skylark-langx-arrays/find',[
  "./arrays"
],function(arrays){
    var _find = Array.prototype.find;

    function find(array,func) {
      return _find.call(array,func);
    }

    return arrays.find = find;
});
define('skylark-langx-arrays/first',[
  "./arrays"
],function(arrays){
    function first(items,n) {
      if (n) {
          return items.slice(0,n);
      } else {
          return items[0];
      }
    }

    return arrays.first = first;
});
define('skylark-langx-arrays/grep',[
  "skylark-langx-objects",
  "./arrays"
],function(objects,arrays){
    function grep(array, callback) {
        var out = [];

        objects.each(array, function(i, item) {
            if (callback(item, i)) {
                out.push(item);
            }
        });

        return out;
    }

    return arrays.grep = grep;
});
define('skylark-langx-arrays/indexof',[
  "./arrays"
],function(arrays){

    function indexOf(array,item) {
      return array.indexOf(item);
    }

    return arrays.indexOf = indexOf;
});
define('skylark-langx-arrays/last',[
  "./arrays"
],function(arrays){
    // Get the last element of an array. 
    function last(arr) {
        return arr[arr.length - 1];     
    }

    return arrays.last = last;
});
define('skylark-langx-arrays/make-array',[
	"skylark-langx-types",
 	"./arrays"
],function(types,arrays){
    function makeArray(obj, offset, startWith) {
       if (types.isArrayLike(obj) ) {
        return (startWith || []).concat(Array.prototype.slice.call(obj, offset || 0));
      }

      // array of single index
      return [ obj ];             
    }

	return arrays.makeArray = makeArray;	
});
define('skylark-langx-arrays/map',[
	"skylark-langx-types",
  	"./arrays",
  	"./flatten"
],function(types,arrays,flatten){
    function map(elements, callback) {
        var value, values = [],
            i, key
        if (types.isArrayLike(elements))
            for (i = 0; i < elements.length; i++) {
                value = callback.call(elements[i], elements[i], i);
                if (value != null) values.push(value)
            }
        else
            for (key in elements) {
                value = callback.call(elements[key], elements[key], key);
                if (value != null) values.push(value)
            }
        return flatten(values)
    }

    return arrays.map = map;
});
define('skylark-langx-arrays/merge',[
  "./arrays"
],function(arrays){

    function merge( first, second ) {
      var l = second.length,
          i = first.length,
          j = 0;

      if ( typeof l === "number" ) {
        for ( ; j < l; j++ ) {
          first[ i++ ] = second[ j ];
        }
      } else {
        while ( second[j] !== undefined ) {
          first[ i++ ] = second[ j++ ];
        }
      }

      first.length = i;

      return first;
    }

    return arrays.merge = merge;
	
});
define('skylark-langx-arrays/pull-at',[
  "skylark-langx-types",
  "skylark-langx-objects",
  "./arrays"
],function(types,objects,arrays){

	/**
	 * Removes elements from `array` corresponding to `indexes` and returns an
	 * array of removed elements.
	 *
	 * **Note:** Unlike `at`, this method mutates `array`.
	 *
	 * @category Array
	 * @param {Array} array The array to modify.
	 * @param {...(number|number[])} [indexes] The indexes of elements to remove.
	 * @returns {Array} Returns the new array of removed elements.
	 * @see pull, pullAll, pullAllBy, pullAllWith, remove, reject
	 * @example
	 *
	 * const array = ['a', 'b', 'c', 'd']
	 * const pulled = pullAt(array, [1, 3])
	 *
	 * console.log(array)
	 * // => ['a', 'c']
	 *
	 * console.log(pulled)
	 * // => ['b', 'd']
	 */
	function pullAt(array, ...indexes) {
	  const length = array == null ? 0 : array.length
	  const result = objects.baseAt(array, indexes)

	  indexes.sort(function(a, b) {
  		return a - b;
	  });

	  for (let i= indexes.length-1;i>=0;i--) {
	  	array.slice(indexes[i],1);
	  }

	  return result
	}

	return arrays.pullAt = pullAt;
});

define('skylark-langx-arrays/reduce',[
  "./arrays"
],function(arrays){

    function reduce(array,callback,initialValue) {
        return Array.prototype.reduce.call(array,callback,initialValue);
    }

    return arrays.reduce = reduce;	
});
define('skylark-langx-arrays/uniq',[
  "./arrays",
  "./filter"
],function(arrays,filter){

    function uniq(array) {
        return filter(array, function(item, idx) {
            return array.indexOf(item) == idx;
        })
    }
	
	return arrays.uniq = uniq;
});
define('skylark-langx-arrays/without',[
	"skylark-langx-funcs",
  "./arrays",
  "./difference"
],function(funcs,arrays,difference){

    // Return a version of the array that does not contain the specified value(s).
    var without = funcs.restArguments(function(array, otherArrays) {
      return difference(array, otherArrays);
    });

    return arrays.without = without;
});
define('skylark-langx-arrays/main',[
	"./arrays",
	"./base-find-index",
	"./base-indexof",
	"./compact",
	"./contains",
	"./difference",
	"./filter",
	"./find",
	"./first",
	"./flatten",
	"./grep",
	"./in-array",
	"./indexof",
	"./last",
	"./make-array",
	"./map",
	"./merge",
	"./pull-at",
	"./reduce",
	"./uniq",
	"./without"
],function(arrays){
	return arrays;
});
define('skylark-langx-arrays', ['skylark-langx-arrays/main'], function (main) { return main; });

define('skylark-langx-constructs/klass',[
  "skylark-langx-ns",
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
  "./constructs",
  "./inherit"
],function(skylark,types,objects,arrays,constructs,inherit){
    var uniq = arrays.uniq,
        has = objects.has,
        mixin = objects.mixin,
        isArray = types.isArray,
        isDefined = types.isDefined;

/* for reference 
 function klass(props,parent) {
    var ctor = function(){
        this._construct();
    };
    ctor.prototype = props;
    if (parent) {
        ctor._proto_ = parent;
        props.__proto__ = parent.prototype;
    }
    return ctor;
}

// Type some JavaScript code here.
let animal = klass({
  _construct(){
      this.name = this.name + ",hi";
  },
    
  name: "Animal",
  eat() {         // [[HomeObject]] == animal
    alert(`${this.name} eats.`);
  }
    
    
});


let rabbit = klass({
  name: "Rabbit",
  _construct(){
      super._construct();
  },
  eat() {         // [[HomeObject]] == rabbit
    super.eat();
  }
},animal);

let longEar = klass({
  name: "Long Ear",
  eat() {         // [[HomeObject]] == longEar
    super.eat();
  }
},rabbit);
*/
    


    var f1 = function() {
        function extendClass(ctor, props, options) {
            // Copy the properties to the prototype of the class.
            var proto = ctor.prototype,
                _super = ctor.superclass.prototype,
                noOverrided = options && options.noOverrided,
                overrides = options && options.overrides || {};

            for (var name in props) {
                if (name === "constructor") {
                    continue;
                }

                // Check if we're overwriting an existing function
                var prop = props[name];
                if (typeof props[name] == "function") {
                    proto[name] =  !prop._constructor && !noOverrided && typeof _super[name] == "function" ?
                          (function(name, fn, superFn) {
                            return function() {
                                var tmp = this.overrided;

                                // Add a new ._super() method that is the same method
                                // but on the super-class
                                this.overrided = superFn;

                                // The method only need to be bound temporarily, so we
                                // remove it when we're done executing
                                var ret = fn.apply(this, arguments);

                                this.overrided = tmp;

                                return ret;
                            };
                        })(name, prop, _super[name]) :
                        prop;
                } else if (types.isPlainObject(prop) && prop!==null && (prop.get)) {
                    Object.defineProperty(proto,name,prop);
                } else {
                    proto[name] = prop;
                }
            }
            return ctor;
        }

        function serialMixins(ctor,mixins) {
            var result = [];

            mixins.forEach(function(mixin){
                if (has(mixin,"__mixins__")) {
                     throw new Error("nested mixins");
                }
                var clss = [];
                while (mixin) {
                    clss.unshift(mixin);
                    mixin = mixin.superclass;
                }
                result = result.concat(clss);
            });

            result = uniq(result);

            result = result.filter(function(mixin){
                var cls = ctor;
                while (cls) {
                    if (mixin === cls) {
                        return false;
                    }
                    if (has(cls,"__mixins__")) {
                        var clsMixines = cls["__mixins__"];
                        for (var i=0; i<clsMixines.length;i++) {
                            if (clsMixines[i]===mixin) {
                                return false;
                            }
                        }
                    }
                    cls = cls.superclass;
                }
                return true;
            });

            if (result.length>0) {
                return result;
            } else {
                return false;
            }
        }

        function mergeMixins(ctor,mixins) {
            var newCtor =ctor;
            for (var i=0;i<mixins.length;i++) {
                var xtor = new Function();

                inherit(xtor,newCtor)
                //xtor.prototype = Object.create(newCtor.prototype);
                //xtor.__proto__ = newCtor;
                xtor.superclass = null;
                mixin(xtor.prototype,mixins[i].prototype);
                xtor.prototype.__mixin__ = mixins[i];
                newCtor = xtor;
            }

            return newCtor;
        }

        function _constructor ()  {
            if (this._construct) {
                return this._construct.apply(this, arguments);
            } else  if (this.init) {
                return this.init.apply(this, arguments);
            }
        }

        return function createClass(props, parent, mixins,options) {
            if (isArray(parent)) {
                options = mixins;
                mixins = parent;
                parent = null;
            }
            parent = parent || Object;

            if (isDefined(mixins) && !isArray(mixins)) {
                options = mixins;
                mixins = false;
            }

            var innerParent = parent;

            if (mixins) {
                mixins = serialMixins(innerParent,mixins);
            }

            if (mixins) {
                innerParent = mergeMixins(innerParent,mixins);
            }

            var klassName = props.klassName || "",
                ctor = new Function(
                    "return function " + klassName + "() {" +
                    "var inst = this," +
                    " ctor = arguments.callee;" +
                    "if (!(inst instanceof ctor)) {" +
                    "inst = Object.create(ctor.prototype);" +
                    "}" +
                    "return ctor._constructor.apply(inst, arguments) || inst;" + 
                    "}"
                )();


            // Populate our constructed prototype object
            ///ctor.prototype = Object.create(innerParent.prototype);

            // Enforce the constructor to be what we expect
            ///ctor.prototype.constructor = ctor;
  
            // And make this class extendable
            ///ctor.__proto__ = innerParent;

            inherit(ctor,innerParent);

            ctor.superclass = parent;

            if (!ctor._constructor) {
                ctor._constructor = _constructor;
            } 

            if (mixins) {
                ctor.__mixins__ = mixins;
            }

            if (!ctor.partial) {
                ctor.partial = function(props, options) {
                    return extendClass(this, props, options);
                };
            }
            if (!ctor.inherit) {
                ctor.inherit = function(props, mixins,options) {
                    return createClass(props, this, mixins,options);
                };
            }

            ctor.partial(props, options);

            return ctor;
        };
    }

    var createClass = f1();

    return constructs.klass = createClass;
});
define('skylark-langx-constructs/main',[
	"./constructs",
	"./inherit",
	"./klass"
],function(constructs){
	return constructs;
});
define('skylark-langx-constructs', ['skylark-langx-constructs/main'], function (main) { return main; });

define('skylark-langx-binary/Buffer',[
  "./memory"
],function(Memory){
  return Memory;
});
define('skylark-jszip/support',[
    "skylark-langx-binary/Buffer",
], function (Buffer) {
    'use strict';
    var support = {};

    support.base64 = true;
    support.array = true;
    support.string = true;
    support.arraybuffer = typeof ArrayBuffer !== 'undefined' && typeof Uint8Array !== 'undefined';
    support.nodebuffer = support.buffer = true;///typeof Buffer !== 'undefined';
    support.uint8array = typeof Uint8Array !== 'undefined';
    if (typeof ArrayBuffer === 'undefined') {
        support.blob = false;
    } else {
        var buffer = new ArrayBuffer(0);
        try {
            support.blob = new Blob([buffer], { type: 'application/zip' }).size === 0;
        } catch (e) {
            try {
                var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
                var builder = new Builder();
                builder.append(buffer);
                support.blob = builder.getBlob('application/zip').size === 0;
            } catch (e) {
                support.blob = false;
            }
        }
    }

    support.getTypeOf = function (input) {
        if (typeof input === 'string') {
            return 'string';
        }
        if (Object.prototype.toString.call(input) === '[object Array]') {
            return 'array';
        }
        if (support.nodebuffer && Buffer.isBuffer(input)) {
            return 'nodebuffer';
        }
        if (support.uint8array && input instanceof Uint8Array) {
            return 'uint8array';
        }
        if (support.arraybuffer && input instanceof ArrayBuffer) {
            return 'arraybuffer';
        }
    };

    return support;
});
define('skylark-jszip/base64',[
    './support'
], function (support) {
    'use strict';

    var _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    function encode(input) {
        var output = [];
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0, len = input.length, remainingBytes = len;
        var isArray = support.getTypeOf(input) !== 'string';
        while (i < input.length) {
            remainingBytes = len - i;
            if (!isArray) {
                chr1 = input.charCodeAt(i++);
                chr2 = i < len ? input.charCodeAt(i++) : 0;
                chr3 = i < len ? input.charCodeAt(i++) : 0;
            } else {
                chr1 = input[i++];
                chr2 = i < len ? input[i++] : 0;
                chr3 = i < len ? input[i++] : 0;
            }
            enc1 = chr1 >> 2;
            enc2 = (chr1 & 3) << 4 | chr2 >> 4;
            enc3 = remainingBytes > 1 ? (chr2 & 15) << 2 | chr3 >> 6 : 64;
            enc4 = remainingBytes > 2 ? chr3 & 63 : 64;
            output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));
        }
        return output.join('');
    };
    function decode(input) {
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0, resultIndex = 0;
        var dataUrlPrefix = 'data:';
        if (input.substr(0, dataUrlPrefix.length) === dataUrlPrefix) {
            throw new Error('Invalid base64 input, it looks like a data url.');
        }
        input = input.replace(/[^A-Za-z0-9+/=]/g, '');
        var totalLength = input.length * 3 / 4;
        if (input.charAt(input.length - 1) === _keyStr.charAt(64)) {
            totalLength--;
        }
        if (input.charAt(input.length - 2) === _keyStr.charAt(64)) {
            totalLength--;
        }
        if (totalLength % 1 !== 0) {
            throw new Error('Invalid base64 input, bad content length.');
        }
        var output;
        if (support.uint8array) {
            output = new Uint8Array(totalLength | 0);
        } else {
            output = new Array(totalLength | 0);
        }
        while (i < input.length) {
            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));
            chr1 = enc1 << 2 | enc2 >> 4;
            chr2 = (enc2 & 15) << 4 | enc3 >> 2;
            chr3 = (enc3 & 3) << 6 | enc4;
            output[resultIndex++] = chr1;
            if (enc3 !== 64) {
                output[resultIndex++] = chr2;
            }
            if (enc4 !== 64) {
                output[resultIndex++] = chr3;
            }
        }
        return output;
    };

    return {
        encode,
        decode
    }
});
define('skylark-jszip/external',[],function () {
    'use strict';

    return  { Promise};
});
define('skylark-jszip/utils',[
    'skylark-langx-binary/buffer',
    'skylark-langx-binary/transform',
    'skylark-langx-binary/arraylike-to-string',
    "skylark-langx-constructs",
    './support',
    './base64',
    './external',
], function (Buffer,transform,arrayLikeToString,constructs,support, base64, external) {
    'use strict';
    var utils = {};


    utils.newBlob = function (part, type) {
        utils.checkSupport('blob');
        try {
            return new Blob([part], { type: type });
        } catch (e) {
            try {
                var Builder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
                var builder = new Builder();
                builder.append(part);
                return builder.getBlob(type);
            } catch (e) {
                throw new Error("Bug : can't construct the Blob.");
            }
        }
    };

    utils.applyFromCharCode = arrayLikeToString;

    utils.transformTo = function (outputType, input) {
        /*
        if (!input) {
            input = '';
        }
        if (!outputType) {
            return input;
        }
        utils.checkSupport(outputType);
        var inputType = utils.getTypeOf(input);
        var result = transform[inputType][outputType](input);
        return result;
        */
        if (outputType=="nodebuffer") {
            outputType = "memory";
        }
        return transform(outputType,input);
    };
    utils.resolve = function (path) {
        var parts = path.split('/');
        var result = [];
        for (var index = 0; index < parts.length; index++) {
            var part = parts[index];
            if (part === '.' || part === '' && index !== 0 && index !== parts.length - 1) {
                continue;
            } else if (part === '..') {
                result.pop();
            } else {
                result.push(part);
            }
        }
        return result.join('/');
    };
    /*
    utils.getTypeOf = function (input) {
        if (typeof input === 'string') {
            return 'string';
        }
        if (Object.prototype.toString.call(input) === '[object Array]') {
            return 'array';
        }
        if (support.nodebuffer && Buffer.isBuffer(input)) {
            return 'nodebuffer';
        }
        if (support.uint8array && input instanceof Uint8Array) {
            return 'uint8array';
        }
        if (support.arraybuffer && input instanceof ArrayBuffer) {
            return 'arraybuffer';
        }
    };
    */
    utils.getTypeOf = support.getTypeOf;
    
    utils.checkSupport = function (type) {
        var supported = support[type.toLowerCase()];
        if (!supported) {
            throw new Error(type + ' is not supported by this platform');
        }
    };
    utils.MAX_VALUE_16BITS = 65535;
    utils.MAX_VALUE_32BITS = -1;
    utils.pretty = function (str) {
        var res = '', code, i;
        for (i = 0; i < (str || '').length; i++) {
            code = str.charCodeAt(i);
            res += '\\x' + (code < 16 ? '0' : '') + code.toString(16).toUpperCase();
        }
        return res;
    };
    utils.delay = function (callback, args, self) {
        setTimeout(function () {
            callback.apply(self || null, args || []);
        });
    };
    utils.inherits = function (ctor, superCtor) {
        var Obj = function () {
        };
        Obj.prototype = superCtor.prototype;
        ctor.prototype = new Obj();
    };
    utils.extend = function () {
        var result = {}, i, attr;
        for (i = 0; i < arguments.length; i++) {
            for (attr in arguments[i]) {
                if (Object.prototype.hasOwnProperty.call(arguments[i], attr) && typeof result[attr] === 'undefined') {
                    result[attr] = arguments[i][attr];
                }
            }
        }
        return result;
    };
    utils.prepareContent = function (name, inputData, isBinary, isOptimizedBinaryString, isBase64) {
        var promise = external.Promise.resolve(inputData).then(function (data) {
            var isBlob = support.blob && (data instanceof Blob || [
                '[object File]',
                '[object Blob]'
            ].indexOf(Object.prototype.toString.call(data)) !== -1);
            if (isBlob && typeof FileReader !== 'undefined') {
                return new external.Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        resolve(e.target.result);
                    };
                    reader.onerror = function (e) {
                        reject(e.target.error);
                    };
                    reader.readAsArrayBuffer(data);
                });
            } else {
                return data;
            }
        });
        return promise.then(function (data) {
            var dataType = utils.getTypeOf(data);
            if (!dataType) {
                return external.Promise.reject(new Error("Can't read the data of '" + name + "'. Is it " + 'in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?'));
            }
            if (dataType === 'arraybuffer') {
                data = utils.transformTo('uint8array', data);
            } else if (dataType === 'string') {
                if (isBase64) {
                    data = base64.decode(data);
                } else if (isBinary) {
                    if (isOptimizedBinaryString !== true) {
                        data = string2binary(data);
                    }
                }
            }
            return data;
        });
    };

    return utils;
});
define('skylark-jszip/stream/GenericWorker',[], function () {
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
define('skylark-jszip/utf8',[
    'skylark-langx-binary/buffer',
    './utils',
    './support',
    './stream/GenericWorker'
], function (Buffer,utils, support,  GenericWorker) {
    'use strict';
    var utf8 = {};

    var _utf8len = new Array(256);
    for (var i = 0; i < 256; i++) {
        _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
    }
    _utf8len[254] = _utf8len[254] = 1;
    var string2buf = function (str) {
        var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
        for (m_pos = 0; m_pos < str_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
                c2 = str.charCodeAt(m_pos + 1);
                if ((c2 & 64512) === 56320) {
                    c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                    m_pos++;
                }
            }
            buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
        }
        if (support.uint8array) {
            buf = new Uint8Array(buf_len);
        } else {
            buf = new Array(buf_len);
        }
        for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
                c2 = str.charCodeAt(m_pos + 1);
                if ((c2 & 64512) === 56320) {
                    c = 65536 + (c - 55296 << 10) + (c2 - 56320);
                    m_pos++;
                }
            }
            if (c < 128) {
                buf[i++] = c;
            } else if (c < 2048) {
                buf[i++] = 192 | c >>> 6;
                buf[i++] = 128 | c & 63;
            } else if (c < 65536) {
                buf[i++] = 224 | c >>> 12;
                buf[i++] = 128 | c >>> 6 & 63;
                buf[i++] = 128 | c & 63;
            } else {
                buf[i++] = 240 | c >>> 18;
                buf[i++] = 128 | c >>> 12 & 63;
                buf[i++] = 128 | c >>> 6 & 63;
                buf[i++] = 128 | c & 63;
            }
        }
        return buf;
    };
    var utf8border = function (buf, max) {
        var pos;
        max = max || buf.length;
        if (max > buf.length) {
            max = buf.length;
        }
        pos = max - 1;
        while (pos >= 0 && (buf[pos] & 192) === 128) {
            pos--;
        }
        if (pos < 0) {
            return max;
        }
        if (pos === 0) {
            return max;
        }
        return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
    var buf2string = function (buf) {
        var i, out, c, c_len;
        var len = buf.length;
        var utf16buf = new Array(len * 2);
        for (out = 0, i = 0; i < len;) {
            c = buf[i++];
            if (c < 128) {
                utf16buf[out++] = c;
                continue;
            }
            c_len = _utf8len[c];
            if (c_len > 4) {
                utf16buf[out++] = 65533;
                i += c_len - 1;
                continue;
            }
            c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
            while (c_len > 1 && i < len) {
                c = c << 6 | buf[i++] & 63;
                c_len--;
            }
            if (c_len > 1) {
                utf16buf[out++] = 65533;
                continue;
            }
            if (c < 65536) {
                utf16buf[out++] = c;
            } else {
                c -= 65536;
                utf16buf[out++] = 55296 | c >> 10 & 1023;
                utf16buf[out++] = 56320 | c & 1023;
            }
        }
        if (utf16buf.length !== out) {
            if (utf16buf.subarray) {
                utf16buf = utf16buf.subarray(0, out);
            } else {
                utf16buf.length = out;
            }
        }
        return utils.applyFromCharCode(utf16buf);
    };
    utf8.utf8encode = function utf8encode(str) {
        if (support.nodebuffer) {
            ///return nodejsUtils.newBufferFrom(str, 'utf-8');
            return Buffer.from(str,'utf-8');
        }
        return string2buf(str);
    };
    utf8.utf8decode = function utf8decode(buf) {
        if (support.nodebuffer) {
            return utils.transformTo('nodebuffer', buf).toString('utf-8');
        }
        buf = utils.transformTo(support.uint8array ? 'uint8array' : 'array', buf);
        return buf2string(buf);
    };
    function Utf8DecodeWorker() {
        GenericWorker.call(this, 'utf-8 decode');
        this.leftOver = null;
    }
    utils.inherits(Utf8DecodeWorker, GenericWorker);
    Utf8DecodeWorker.prototype.processChunk = function (chunk) {
        var data = utils.transformTo(support.uint8array ? 'uint8array' : 'array', chunk.data);
        if (this.leftOver && this.leftOver.length) {
            if (support.uint8array) {
                var previousData = data;
                data = new Uint8Array(previousData.length + this.leftOver.length);
                data.set(this.leftOver, 0);
                data.set(previousData, this.leftOver.length);
            } else {
                data = this.leftOver.concat(data);
            }
            this.leftOver = null;
        }
        var nextBoundary = utf8border(data);
        var usableData = data;
        if (nextBoundary !== data.length) {
            if (support.uint8array) {
                usableData = data.subarray(0, nextBoundary);
                this.leftOver = data.subarray(nextBoundary, data.length);
            } else {
                usableData = data.slice(0, nextBoundary);
                this.leftOver = data.slice(nextBoundary, data.length);
            }
        }
        this.push({
            data: utf8.utf8decode(usableData),
            meta: chunk.meta
        });
    };
    Utf8DecodeWorker.prototype.flush = function () {
        if (this.leftOver && this.leftOver.length) {
            this.push({
                data: utf8.utf8decode(this.leftOver),
                meta: {}
            });
            this.leftOver = null;
        }
    };
    utf8.Utf8DecodeWorker = Utf8DecodeWorker;
    function Utf8EncodeWorker() {
        GenericWorker.call(this, 'utf-8 encode');
    }
    utils.inherits(Utf8EncodeWorker, GenericWorker);
    Utf8EncodeWorker.prototype.processChunk = function (chunk) {
        this.push({
            data: utf8.utf8encode(chunk.data),
            meta: chunk.meta
        });
    };
    utf8.Utf8EncodeWorker = Utf8EncodeWorker;

    return utf8;
});
define('skylark-jszip/stream/ConvertWorker',[
    './GenericWorker',
    '../utils'
], function (GenericWorker, utils) {
    'use strict';

    function ConvertWorker(destType) {
        GenericWorker.call(this, 'ConvertWorker to ' + destType);
        this.destType = destType;
    }
    utils.inherits(ConvertWorker, GenericWorker);
    ConvertWorker.prototype.processChunk = function (chunk) {
        this.push({
            data: utils.transformTo(this.destType, chunk.data),
            meta: chunk.meta
        });
    };

    return ConvertWorker;

});
define('skylark-jszip/stream/StreamHelper',[
    '../utils',
    './ConvertWorker',
    './GenericWorker',
    '../base64',
    '../support',
    '../external'
], function (utils, ConvertWorker, GenericWorker, base64, support, external) {
    'use strict';

    ///if (support.nodestream) {
    ///    try {
    ///        NodejsStreamOutputAdapter = __module__6;
    ///    } catch (e) {
    ///    }
    ///}
    function transformZipOutput(type, content, mimeType) {
        switch (type) {
        case 'blob':
            return utils.newBlob(utils.transformTo('arraybuffer', content), mimeType);
        case 'base64':
            return base64.encode(content);
        default:
            return utils.transformTo(type, content);
        }
    }
    function concat(type, dataArray) {
        var i, index = 0, res = null, totalLength = 0;
        for (i = 0; i < dataArray.length; i++) {
            totalLength += dataArray[i].length;
        }
        switch (type) {
        case 'string':
            return dataArray.join('');
        case 'array':
            return Array.prototype.concat.apply([], dataArray);
        case 'uint8array':
            res = new Uint8Array(totalLength);
            for (i = 0; i < dataArray.length; i++) {
                res.set(dataArray[i], index);
                index += dataArray[i].length;
            }
            return res;
        case 'nodebuffer':
            return Buffer.concat(dataArray);
        default:
            throw new Error("concat : unsupported type '" + type + "'");
        }
    }
    function accumulate(helper, updateCallback) {
        return new external.Promise(function (resolve, reject) {
            var dataArray = [];
            var chunkType = helper._internalType, resultType = helper._outputType, mimeType = helper._mimeType;
            helper.on('data', function (data, meta) {
                dataArray.push(data);
                if (updateCallback) {
                    updateCallback(meta);
                }
            }).on('error', function (err) {
                dataArray = [];
                reject(err);
            }).on('end', function () {
                try {
                    var result = transformZipOutput(resultType, concat(chunkType, dataArray), mimeType);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
                dataArray = [];
            }).resume();
        });
    }
    function StreamHelper(worker, outputType, mimeType) {
        var internalType = outputType;
        switch (outputType) {
        case 'blob':
        case 'arraybuffer':
            internalType = 'uint8array';
            break;
        case 'base64':
            internalType = 'string';
            break;
        }
        try {
            this._internalType = internalType;
            this._outputType = outputType;
            this._mimeType = mimeType;
            utils.checkSupport(internalType);
            this._worker = worker.pipe(new ConvertWorker(internalType));
            worker.lock();
        } catch (e) {
            this._worker = new GenericWorker('error');
            this._worker.error(e);
        }
    }
    StreamHelper.prototype = {
        accumulate: function (updateCb) {
            return accumulate(this, updateCb);
        },
        on: function (evt, fn) {
            var self = this;
            if (evt === 'data') {
                this._worker.on(evt, function (chunk) {
                    fn.call(self, chunk.data, chunk.meta);
                });
            } else {
                this._worker.on(evt, function () {
                    utils.delay(fn, arguments, self);
                });
            }
            return this;
        },
        resume: function () {
            utils.delay(this._worker.resume, [], this._worker);
            return this;
        },
        pause: function () {
            this._worker.pause();
            return this;
        },
        toNodejsStream: function (updateCb) {
            utils.checkSupport('nodestream');
            if (this._outputType !== 'nodebuffer') {
                throw new Error(this._outputType + ' is not supported by this method');
            }
            return new NodejsStreamOutputAdapter(this, { objectMode: this._outputType !== 'nodebuffer' }, updateCb);
        }
    };
   
    return StreamHelper;
});
define('skylark-jszip/defaults',[], function () {
    'use strict';
    var exports = {};
    var module = { exports: {} };
    exports.base64 = false;
    exports.binary = false;
    exports.dir = false;
    exports.createFolders = true;
    exports.date = null;
    exports.compression = null;
    exports.compressionOptions = null;
    exports.comment = null;
    exports.unixPermissions = null;
    exports.dosPermissions = null;
    function __isEmptyObject(obj) {
        var attr;
        for (attr in obj)
            return !1;
        return !0;
    }
    function __isValidToReturn(obj) {
        return typeof obj != 'object' || Array.isArray(obj) || !__isEmptyObject(obj);
    }
    if (__isValidToReturn(module.exports))
        return module.exports;
    else if (__isValidToReturn(exports))
        return exports;
});
define('skylark-jszip/stream/DataWorker',[
    '../utils',
    './GenericWorker'
], function (utils, GenericWorker) {
    'use strict';

    var DEFAULT_BLOCK_SIZE = 16 * 1024;
    function DataWorker(dataP) {
        GenericWorker.call(this, 'DataWorker');
        var self = this;
        this.dataIsReady = false;
        this.index = 0;
        this.max = 0;
        this.data = null;
        this.type = '';
        this._tickScheduled = false;
        dataP.then(function (data) {
            self.dataIsReady = true;
            self.data = data;
            self.max = data && data.length || 0;
            self.type = utils.getTypeOf(data);
            if (!self.isPaused) {
                self._tickAndRepeat();
            }
        }, function (e) {
            self.error(e);
        });
    }
    utils.inherits(DataWorker, GenericWorker);
    DataWorker.prototype.cleanUp = function () {
        GenericWorker.prototype.cleanUp.call(this);
        this.data = null;
    };
    DataWorker.prototype.resume = function () {
        if (!GenericWorker.prototype.resume.call(this)) {
            return false;
        }
        if (!this._tickScheduled && this.dataIsReady) {
            this._tickScheduled = true;
            utils.delay(this._tickAndRepeat, [], this);
        }
        return true;
    };
    DataWorker.prototype._tickAndRepeat = function () {
        this._tickScheduled = false;
        if (this.isPaused || this.isFinished) {
            return;
        }
        this._tick();
        if (!this.isFinished) {
            utils.delay(this._tickAndRepeat, [], this);
            this._tickScheduled = true;
        }
    };
    DataWorker.prototype._tick = function () {
        if (this.isPaused || this.isFinished) {
            return false;
        }
        var size = DEFAULT_BLOCK_SIZE;
        var data = null, nextIndex = Math.min(this.max, this.index + size);
        if (this.index >= this.max) {
            return this.end();
        } else {
            switch (this.type) {
            case 'string':
                data = this.data.substring(this.index, nextIndex);
                break;
            case 'uint8array':
                data = this.data.subarray(this.index, nextIndex);
                break;
            case 'array':
            case 'nodebuffer':
                data = this.data.slice(this.index, nextIndex);
                break;
            }
            this.index = nextIndex;
            return this.push({
                data: data,
                meta: { percent: this.max ? this.index / this.max * 100 : 0 }
            });
        }
    };
    
    return DataWorker;
});
define('skylark-jszip/crc32',['./utils'], function (utils) {
    'use strict';

    function makeTable() {
        var c, table = [];
        for (var n = 0; n < 256; n++) {
            c = n;
            for (var k = 0; k < 8; k++) {
                c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
            }
            table[n] = c;
        }
        return table;
    }
    var crcTable = makeTable();
    function crc32(crc, buf, len, pos) {
        var t = crcTable, end = pos + len;
        crc = crc ^ -1;
        for (var i = pos; i < end; i++) {
            crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
        }
        return crc ^ -1;
    }
    function crc32str(crc, str, len, pos) {
        var t = crcTable, end = pos + len;
        crc = crc ^ -1;
        for (var i = pos; i < end; i++) {
            crc = crc >>> 8 ^ t[(crc ^ str.charCodeAt(i)) & 255];
        }
        return crc ^ -1;
    }
    function crc32wrapper(input, crc) {
        if (typeof input === 'undefined' || !input.length) {
            return 0;
        }
        var isArray = utils.getTypeOf(input) !== 'string';
        if (isArray) {
            return crc32(crc | 0, input, input.length, 0);
        } else {
            return crc32str(crc | 0, input, input.length, 0);
        }
    }

    return crc32wrapper;
});
define('skylark-jszip/stream/Crc32Probe',[
    './GenericWorker',
    '../crc32',
    '../utils'
], function (GenericWorker, crc32, utils) {
    'use strict';

    function Crc32Probe() {
        GenericWorker.call(this, 'Crc32Probe');
        this.withStreamInfo('crc32', 0);
    }
    utils.inherits(Crc32Probe, GenericWorker);
    Crc32Probe.prototype.processChunk = function (chunk) {
        this.streamInfo.crc32 = crc32(chunk.data, this.streamInfo.crc32 || 0);
        this.push(chunk);
    };
    
    return Crc32Probe;

});
define('skylark-jszip/stream/DataLengthProbe',[
    '../utils',
    './GenericWorker'
], function (utils, GenericWorker) {
    'use strict';

    function DataLengthProbe(propName) {
        GenericWorker.call(this, 'DataLengthProbe for ' + propName);
        this.propName = propName;
        this.withStreamInfo(propName, 0);
    }
    utils.inherits(DataLengthProbe, GenericWorker);
    DataLengthProbe.prototype.processChunk = function (chunk) {
        if (chunk) {
            var length = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = length + chunk.data.length;
        }
        GenericWorker.prototype.processChunk.call(this, chunk);
    };
    return DataLengthProbe;

});
define('skylark-jszip/compressedObject',[
    './external',
    './stream/DataWorker',
    './stream/Crc32Probe',
    './stream/DataLengthProbe'
], function (external, DataWorker, Crc32Probe, DataLengthProbe) {
    'use strict';

    function CompressedObject(compressedSize, uncompressedSize, crc32, compression, data) {
        this.compressedSize = compressedSize;
        this.uncompressedSize = uncompressedSize;
        this.crc32 = crc32;
        this.compression = compression;
        this.compressedContent = data;
    }
    CompressedObject.prototype = {
        getContentWorker: function () {
            var worker = new DataWorker(external.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new DataLengthProbe('data_length'));
            var that = this;
            worker.on('end', function () {
                if (this.streamInfo['data_length'] !== that.uncompressedSize) {
                    throw new Error('Bug : uncompressed data size mismatch');
                }
            });
            return worker;
        },
        getCompressedWorker: function () {
            return new DataWorker(external.Promise.resolve(this.compressedContent)).withStreamInfo('compressedSize', this.compressedSize).withStreamInfo('uncompressedSize', this.uncompressedSize).withStreamInfo('crc32', this.crc32).withStreamInfo('compression', this.compression);
        }
    };
    CompressedObject.createWorkerFrom = function (uncompressedWorker, compression, compressionOptions) {
        return uncompressedWorker.pipe(new Crc32Probe()).pipe(new DataLengthProbe('uncompressedSize')).pipe(compression.compressWorker(compressionOptions)).pipe(new DataLengthProbe('compressedSize')).withStreamInfo('compression', compression);
    };
    
    return CompressedObject;

});
define('skylark-jszip/zipObject',[
    './stream/StreamHelper',
    './stream/DataWorker',
    './utf8',
    './compressedObject',
    './stream/GenericWorker'
], function (StreamHelper, DataWorker, utf8, CompressedObject, GenericWorker) {
    'use strict';

    var ZipObject = function (name, data, options) {
        this.name = name;
        this.dir = options.dir;
        this.date = options.date;
        this.comment = options.comment;
        this.unixPermissions = options.unixPermissions;
        this.dosPermissions = options.dosPermissions;
        this._data = data;
        this._dataBinary = options.binary;
        this.options = {
            compression: options.compression,
            compressionOptions: options.compressionOptions
        };
    };
    ZipObject.prototype = {
        internalStream: function (type) {
            var result = null, outputType = 'string';
            try {
                if (!type) {
                    throw new Error('No output type specified.');
                }
                outputType = type.toLowerCase();
                var askUnicodeString = outputType === 'string' || outputType === 'text';
                if (outputType === 'binarystring' || outputType === 'text') {
                    outputType = 'string';
                }
                result = this._decompressWorker();
                var isUnicodeString = !this._dataBinary;
                if (isUnicodeString && !askUnicodeString) {
                    result = result.pipe(new utf8.Utf8EncodeWorker());
                }
                if (!isUnicodeString && askUnicodeString) {
                    result = result.pipe(new utf8.Utf8DecodeWorker());
                }
            } catch (e) {
                result = new GenericWorker('error');
                result.error(e);
            }
            return new StreamHelper(result, outputType, '');
        },
        async: function (type, onUpdate) {
            return this.internalStream(type).accumulate(onUpdate);
        },
        nodeStream: function (type, onUpdate) {
            return this.internalStream(type || 'nodebuffer').toNodejsStream(onUpdate);
        },
        _compressWorker: function (compression, compressionOptions) {
            if (this._data instanceof CompressedObject && this._data.compression.magic === compression.magic) {
                return this._data.getCompressedWorker();
            } else {
                var result = this._decompressWorker();
                if (!this._dataBinary) {
                    result = result.pipe(new utf8.Utf8EncodeWorker());
                }
                return CompressedObject.createWorkerFrom(result, compression, compressionOptions);
            }
        },
        _decompressWorker: function () {
            if (this._data instanceof CompressedObject) {
                return this._data.getContentWorker();
            } else if (this._data instanceof GenericWorker) {
                return this._data;
            } else {
                return new DataWorker(this._data);
            }
        }
    };
    var removedMethods = [
        'asText',
        'asBinary',
        'asNodeBuffer',
        'asUint8Array',
        'asArrayBuffer'
    ];
    var removedFn = function () {
        throw new Error('This method has been removed in JSZip 3.0, please check the upgrade guide.');
    };
    for (var i = 0; i < removedMethods.length; i++) {
        ZipObject.prototype[removedMethods[i]] = removedFn;
    }
    return ZipObject;

});
define('skylark-langx-compression/compression',[
  "skylark-langx-ns",
],function(skylark){
	"use strict";

	return skylark.attach("langx.compression",{
	});
});
define('skylark-langx-compression/constants',[
    "./compression"
], function (compression) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin

    return compression.constants = {
        /* Allowed flush values; see deflate() and inflate() below for details */
        Z_NO_FLUSH: 0,
        Z_PARTIAL_FLUSH: 1,
        Z_SYNC_FLUSH: 2,
        Z_FULL_FLUSH: 3,
        Z_FINISH: 4,
        Z_BLOCK: 5,
        Z_TREES: 6,

        /* Return codes for the compression/decompression functions. Negative values
         * are errors, positive values are used for special but normal events.
        */
        Z_OK: 0,
        Z_STREAM_END: 1,
        Z_NEED_DICT: 2,
        Z_ERRNO: -1,
        Z_STREAM_ERROR: -2,
        Z_DATA_ERROR: -3,
        Z_MEM_ERROR: -4,
        Z_BUF_ERROR: -5,
        //Z_VERSION_ERROR: -6,

        /* compression levels */
        Z_NO_COMPRESSION: 0,
        Z_BEST_SPEED: 1,
        Z_BEST_COMPRESSION: 9,
        Z_DEFAULT_COMPRESSION: -1,
        Z_FILTERED: 1,
        Z_HUFFMAN_ONLY: 2,
        Z_RLE: 3,
        Z_FIXED: 4,
        Z_DEFAULT_STRATEGY: 0,

        /* Possible values of the data_type field (though see inflate()) */
        Z_BINARY: 0,
        Z_TEXT: 1,
        //Z_ASCII: 1, // = Z_TEXT (deprecated)
        Z_UNKNOWN: 2,

        /* The deflate compression method */
        Z_DEFLATED: 8
        //Z_NULL: null // Use -1 or null inline, depending on var type
    };

});
define('skylark-langx-compression/trees',[
    "./compression"
], function (compression) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin

    //const Z_FILTERED          = 1;
    //const Z_HUFFMAN_ONLY      = 2;
    //const Z_RLE               = 3;
    const Z_FIXED               = 4;
    //const Z_DEFAULT_STRATEGY  = 0;

    /* Possible values of the data_type field (though see inflate()) */
    const Z_BINARY              = 0;
    const Z_TEXT                = 1;
    //const Z_ASCII             = 1; // = Z_TEXT
    const Z_UNKNOWN             = 2;

    /*============================================================================*/


    function zero(buf) { let len = buf.length; while (--len >= 0) { buf[len] = 0; } }

    // From zutil.h

    const STORED_BLOCK = 0;
    const STATIC_TREES = 1;
    const DYN_TREES    = 2;
    /* The three kinds of block type */

    const MIN_MATCH    = 3;
    const MAX_MATCH    = 258;
    /* The minimum and maximum match lengths */

    // From deflate.h
    /* ===========================================================================
     * Internal compression state.
     */

    const LENGTH_CODES  = 29;
    /* number of length codes, not counting the special END_BLOCK code */

    const LITERALS      = 256;
    /* number of literal bytes 0..255 */

    const L_CODES       = LITERALS + 1 + LENGTH_CODES;
    /* number of Literal or Length codes, including the END_BLOCK code */

    const D_CODES       = 30;
    /* number of distance codes */

    const BL_CODES      = 19;
    /* number of codes used to transfer the bit lengths */

    const HEAP_SIZE     = 2 * L_CODES + 1;
    /* maximum heap size */

    const MAX_BITS      = 15;
    /* All codes must not exceed MAX_BITS bits */

    const Buf_size      = 16;
    /* size of bit buffer in bi_buf */


    /* ===========================================================================
     * Constants
     */

    const MAX_BL_BITS = 7;
    /* Bit length codes must not exceed MAX_BL_BITS bits */

    const END_BLOCK   = 256;
    /* end of block literal code */

    const REP_3_6     = 16;
    /* repeat previous bit length 3-6 times (2 bits of repeat count) */

    const REPZ_3_10   = 17;
    /* repeat a zero length 3-10 times  (3 bits of repeat count) */

    const REPZ_11_138 = 18;
    /* repeat a zero length 11-138 times  (7 bits of repeat count) */

    /* eslint-disable comma-spacing,array-bracket-spacing */
    const extra_lbits =   /* extra bits for each length code */
      new Uint8Array([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0]);

    const extra_dbits =   /* extra bits for each distance code */
      new Uint8Array([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13]);

    const extra_blbits =  /* extra bits for each bit length code */
      new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7]);

    const bl_order =
      new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]);
    /* eslint-enable comma-spacing,array-bracket-spacing */

    /* The lengths of the bit length codes are sent in order of decreasing
     * probability, to avoid transmitting the lengths for unused bit length codes.
     */

    /* ===========================================================================
     * Local data. These are initialized only once.
     */

    // We pre-fill arrays with 0 to avoid uninitialized gaps

    const DIST_CODE_LEN = 512; /* see definition of array dist_code below */

    // !!!! Use flat array instead of structure, Freq = i*2, Len = i*2+1
    const static_ltree  = new Array((L_CODES + 2) * 2);
    zero(static_ltree);
    /* The static literal tree. Since the bit lengths are imposed, there is no
     * need for the L_CODES extra codes used during heap construction. However
     * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
     * below).
     */

    const static_dtree  = new Array(D_CODES * 2);
    zero(static_dtree);
    /* The static distance tree. (Actually a trivial tree since all codes use
     * 5 bits.)
     */

    const _dist_code    = new Array(DIST_CODE_LEN);
    zero(_dist_code);
    /* Distance codes. The first 256 values correspond to the distances
     * 3 .. 258, the last 256 values correspond to the top 8 bits of
     * the 15 bit distances.
     */

    const _length_code  = new Array(MAX_MATCH - MIN_MATCH + 1);
    zero(_length_code);
    /* length code for each normalized match length (0 == MIN_MATCH) */

    const base_length   = new Array(LENGTH_CODES);
    zero(base_length);
    /* First normalized length for each code (0 = MIN_MATCH) */

    const base_dist     = new Array(D_CODES);
    zero(base_dist);
    /* First normalized distance for each code (0 = distance of 1) */


    function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {

      this.static_tree  = static_tree;  /* static tree or NULL */
      this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
      this.extra_base   = extra_base;   /* base index for extra_bits */
      this.elems        = elems;        /* max number of elements in the tree */
      this.max_length   = max_length;   /* max bit length for the codes */

      // show if `static_tree` has data or dummy - needed for monomorphic objects
      this.has_stree    = static_tree && static_tree.length;
    }


    let static_l_desc;
    let static_d_desc;
    let static_bl_desc;


    function TreeDesc(dyn_tree, stat_desc) {
      this.dyn_tree = dyn_tree;     /* the dynamic tree */
      this.max_code = 0;            /* largest code with non zero frequency */
      this.stat_desc = stat_desc;   /* the corresponding static tree */
    }



    const d_code = (dist) => {

      return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
    };


    /* ===========================================================================
     * Output a short LSB first on the stream.
     * IN assertion: there is enough room in pendingBuf.
     */
    const put_short = (s, w) => {
    //    put_byte(s, (uch)((w) & 0xff));
    //    put_byte(s, (uch)((ush)(w) >> 8));
      s.pending_buf[s.pending++] = (w) & 0xff;
      s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
    };


    /* ===========================================================================
     * Send a value on a given number of bits.
     * IN assertion: length <= 16 and value fits in length bits.
     */
    const send_bits = (s, value, length) => {

      if (s.bi_valid > (Buf_size - length)) {
        s.bi_buf |= (value << s.bi_valid) & 0xffff;
        put_short(s, s.bi_buf);
        s.bi_buf = value >> (Buf_size - s.bi_valid);
        s.bi_valid += length - Buf_size;
      } else {
        s.bi_buf |= (value << s.bi_valid) & 0xffff;
        s.bi_valid += length;
      }
    };


    const send_code = (s, c, tree) => {

      send_bits(s, tree[c * 2]/*.Code*/, tree[c * 2 + 1]/*.Len*/);
    };


    /* ===========================================================================
     * Reverse the first len bits of a code, using straightforward code (a faster
     * method would use a table)
     * IN assertion: 1 <= len <= 15
     */
    const bi_reverse = (code, len) => {

      let res = 0;
      do {
        res |= code & 1;
        code >>>= 1;
        res <<= 1;
      } while (--len > 0);
      return res >>> 1;
    };


    /* ===========================================================================
     * Flush the bit buffer, keeping at most 7 bits in it.
     */
    const bi_flush = (s) => {

      if (s.bi_valid === 16) {
        put_short(s, s.bi_buf);
        s.bi_buf = 0;
        s.bi_valid = 0;

      } else if (s.bi_valid >= 8) {
        s.pending_buf[s.pending++] = s.bi_buf & 0xff;
        s.bi_buf >>= 8;
        s.bi_valid -= 8;
      }
    };


    /* ===========================================================================
     * Compute the optimal bit lengths for a tree and update the total bit length
     * for the current block.
     * IN assertion: the fields freq and dad are set, heap[heap_max] and
     *    above are the tree nodes sorted by increasing frequency.
     * OUT assertions: the field len is set to the optimal bit length, the
     *     array bl_count contains the frequencies for each bit length.
     *     The length opt_len is updated; static_len is also updated if stree is
     *     not null.
     */
    const gen_bitlen = (s, desc) =>
    //    deflate_state *s;
    //    tree_desc *desc;    /* the tree descriptor */
    {
      const tree            = desc.dyn_tree;
      const max_code        = desc.max_code;
      const stree           = desc.stat_desc.static_tree;
      const has_stree       = desc.stat_desc.has_stree;
      const extra           = desc.stat_desc.extra_bits;
      const base            = desc.stat_desc.extra_base;
      const max_length      = desc.stat_desc.max_length;
      let h;              /* heap index */
      let n, m;           /* iterate over the tree elements */
      let bits;           /* bit length */
      let xbits;          /* extra bits */
      let f;              /* frequency */
      let overflow = 0;   /* number of elements with bit length too large */

      for (bits = 0; bits <= MAX_BITS; bits++) {
        s.bl_count[bits] = 0;
      }

      /* In a first pass, compute the optimal bit lengths (which may
       * overflow in the case of the bit length tree).
       */
      tree[s.heap[s.heap_max] * 2 + 1]/*.Len*/ = 0; /* root of the heap */

      for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
        n = s.heap[h];
        bits = tree[tree[n * 2 + 1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
        if (bits > max_length) {
          bits = max_length;
          overflow++;
        }
        tree[n * 2 + 1]/*.Len*/ = bits;
        /* We overwrite tree[n].Dad which is no longer needed */

        if (n > max_code) { continue; } /* not a leaf node */

        s.bl_count[bits]++;
        xbits = 0;
        if (n >= base) {
          xbits = extra[n - base];
        }
        f = tree[n * 2]/*.Freq*/;
        s.opt_len += f * (bits + xbits);
        if (has_stree) {
          s.static_len += f * (stree[n * 2 + 1]/*.Len*/ + xbits);
        }
      }
      if (overflow === 0) { return; }

      // Trace((stderr,"\nbit length overflow\n"));
      /* This happens for example on obj2 and pic of the Calgary corpus */

      /* Find the first bit length which could increase: */
      do {
        bits = max_length - 1;
        while (s.bl_count[bits] === 0) { bits--; }
        s.bl_count[bits]--;      /* move one leaf down the tree */
        s.bl_count[bits + 1] += 2; /* move one overflow item as its brother */
        s.bl_count[max_length]--;
        /* The brother of the overflow item also moves one step up,
         * but this does not affect bl_count[max_length]
         */
        overflow -= 2;
      } while (overflow > 0);

      /* Now recompute all bit lengths, scanning in increasing frequency.
       * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
       * lengths instead of fixing only the wrong ones. This idea is taken
       * from 'ar' written by Haruhiko Okumura.)
       */
      for (bits = max_length; bits !== 0; bits--) {
        n = s.bl_count[bits];
        while (n !== 0) {
          m = s.heap[--h];
          if (m > max_code) { continue; }
          if (tree[m * 2 + 1]/*.Len*/ !== bits) {
            // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
            s.opt_len += (bits - tree[m * 2 + 1]/*.Len*/) * tree[m * 2]/*.Freq*/;
            tree[m * 2 + 1]/*.Len*/ = bits;
          }
          n--;
        }
      }
    };


    /* ===========================================================================
     * Generate the codes for a given tree and bit counts (which need not be
     * optimal).
     * IN assertion: the array bl_count contains the bit length statistics for
     * the given tree and the field len is set for all tree elements.
     * OUT assertion: the field code is set for all tree elements of non
     *     zero code length.
     */
    const gen_codes = (tree, max_code, bl_count) =>
    //    ct_data *tree;             /* the tree to decorate */
    //    int max_code;              /* largest code with non zero frequency */
    //    ushf *bl_count;            /* number of codes at each bit length */
    {
      const next_code = new Array(MAX_BITS + 1); /* next code value for each bit length */
      let code = 0;              /* running code value */
      let bits;                  /* bit index */
      let n;                     /* code index */

      /* The distribution counts are first used to generate the code values
       * without bit reversal.
       */
      for (bits = 1; bits <= MAX_BITS; bits++) {
        next_code[bits] = code = (code + bl_count[bits - 1]) << 1;
      }
      /* Check that the bit counts in bl_count are consistent. The last code
       * must be all ones.
       */
      //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
      //        "inconsistent bit counts");
      //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

      for (n = 0;  n <= max_code; n++) {
        let len = tree[n * 2 + 1]/*.Len*/;
        if (len === 0) { continue; }
        /* Now reverse the bits */
        tree[n * 2]/*.Code*/ = bi_reverse(next_code[len]++, len);

        //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
        //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
      }
    };


    /* ===========================================================================
     * Initialize the various 'constant' tables.
     */
    const tr_static_init = () => {

      let n;        /* iterates over tree elements */
      let bits;     /* bit counter */
      let length;   /* length value */
      let code;     /* code value */
      let dist;     /* distance index */
      const bl_count = new Array(MAX_BITS + 1);
      /* number of codes at each bit length for an optimal tree */

      // do check in _tr_init()
      //if (static_init_done) return;

      /* For some embedded targets, global variables are not initialized: */
    /*#ifdef NO_INIT_GLOBAL_POINTERS
      static_l_desc.static_tree = static_ltree;
      static_l_desc.extra_bits = extra_lbits;
      static_d_desc.static_tree = static_dtree;
      static_d_desc.extra_bits = extra_dbits;
      static_bl_desc.extra_bits = extra_blbits;
    #endif*/

      /* Initialize the mapping length (0..255) -> length code (0..28) */
      length = 0;
      for (code = 0; code < LENGTH_CODES - 1; code++) {
        base_length[code] = length;
        for (n = 0; n < (1 << extra_lbits[code]); n++) {
          _length_code[length++] = code;
        }
      }
      //Assert (length == 256, "tr_static_init: length != 256");
      /* Note that the length 255 (match length 258) can be represented
       * in two different ways: code 284 + 5 bits or code 285, so we
       * overwrite length_code[255] to use the best encoding:
       */
      _length_code[length - 1] = code;

      /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
      dist = 0;
      for (code = 0; code < 16; code++) {
        base_dist[code] = dist;
        for (n = 0; n < (1 << extra_dbits[code]); n++) {
          _dist_code[dist++] = code;
        }
      }
      //Assert (dist == 256, "tr_static_init: dist != 256");
      dist >>= 7; /* from now on, all distances are divided by 128 */
      for (; code < D_CODES; code++) {
        base_dist[code] = dist << 7;
        for (n = 0; n < (1 << (extra_dbits[code] - 7)); n++) {
          _dist_code[256 + dist++] = code;
        }
      }
      //Assert (dist == 256, "tr_static_init: 256+dist != 512");

      /* Construct the codes of the static literal tree */
      for (bits = 0; bits <= MAX_BITS; bits++) {
        bl_count[bits] = 0;
      }

      n = 0;
      while (n <= 143) {
        static_ltree[n * 2 + 1]/*.Len*/ = 8;
        n++;
        bl_count[8]++;
      }
      while (n <= 255) {
        static_ltree[n * 2 + 1]/*.Len*/ = 9;
        n++;
        bl_count[9]++;
      }
      while (n <= 279) {
        static_ltree[n * 2 + 1]/*.Len*/ = 7;
        n++;
        bl_count[7]++;
      }
      while (n <= 287) {
        static_ltree[n * 2 + 1]/*.Len*/ = 8;
        n++;
        bl_count[8]++;
      }
      /* Codes 286 and 287 do not exist, but we must include them in the
       * tree construction to get a canonical Huffman tree (longest code
       * all ones)
       */
      gen_codes(static_ltree, L_CODES + 1, bl_count);

      /* The static distance tree is trivial: */
      for (n = 0; n < D_CODES; n++) {
        static_dtree[n * 2 + 1]/*.Len*/ = 5;
        static_dtree[n * 2]/*.Code*/ = bi_reverse(n, 5);
      }

      // Now data ready and we can init static trees
      static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
      static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES, MAX_BITS);
      static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES, MAX_BL_BITS);

      //static_init_done = true;
    };


    /* ===========================================================================
     * Initialize a new block.
     */
    const init_block = (s) => {

      let n; /* iterates over tree elements */

      /* Initialize the trees. */
      for (n = 0; n < L_CODES;  n++) { s.dyn_ltree[n * 2]/*.Freq*/ = 0; }
      for (n = 0; n < D_CODES;  n++) { s.dyn_dtree[n * 2]/*.Freq*/ = 0; }
      for (n = 0; n < BL_CODES; n++) { s.bl_tree[n * 2]/*.Freq*/ = 0; }

      s.dyn_ltree[END_BLOCK * 2]/*.Freq*/ = 1;
      s.opt_len = s.static_len = 0;
      s.last_lit = s.matches = 0;
    };


    /* ===========================================================================
     * Flush the bit buffer and align the output on a byte boundary
     */
    const bi_windup = (s) =>
    {
      if (s.bi_valid > 8) {
        put_short(s, s.bi_buf);
      } else if (s.bi_valid > 0) {
        //put_byte(s, (Byte)s->bi_buf);
        s.pending_buf[s.pending++] = s.bi_buf;
      }
      s.bi_buf = 0;
      s.bi_valid = 0;
    };

    /* ===========================================================================
     * Copy a stored block, storing first the length and its
     * one's complement if requested.
     */
    const copy_block = (s, buf, len, header) =>
    //DeflateState *s;
    //charf    *buf;    /* the input data */
    //unsigned len;     /* its length */
    //int      header;  /* true if block header must be written */
    {
      bi_windup(s);        /* align on byte boundary */

      if (header) {
        put_short(s, len);
        put_short(s, ~len);
      }
    //  while (len--) {
    //    put_byte(s, *buf++);
    //  }
      s.pending_buf.set(s.window.subarray(buf, buf + len), s.pending);
      s.pending += len;
    };

    /* ===========================================================================
     * Compares to subtrees, using the tree depth as tie breaker when
     * the subtrees have equal frequency. This minimizes the worst case length.
     */
    const smaller = (tree, n, m, depth) => {

      const _n2 = n * 2;
      const _m2 = m * 2;
      return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
             (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
    };

    /* ===========================================================================
     * Restore the heap property by moving down the tree starting at node k,
     * exchanging a node with the smallest of its two sons if necessary, stopping
     * when the heap property is re-established (each father smaller than its
     * two sons).
     */
    const pqdownheap = (s, tree, k) =>
    //    deflate_state *s;
    //    ct_data *tree;  /* the tree to restore */
    //    int k;               /* node to move down */
    {
      const v = s.heap[k];
      let j = k << 1;  /* left son of k */
      while (j <= s.heap_len) {
        /* Set j to the smallest of the two sons: */
        if (j < s.heap_len &&
          smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
          j++;
        }
        /* Exit if v is smaller than both sons */
        if (smaller(tree, v, s.heap[j], s.depth)) { break; }

        /* Exchange v with the smallest son */
        s.heap[k] = s.heap[j];
        k = j;

        /* And continue down the tree, setting j to the left son of k */
        j <<= 1;
      }
      s.heap[k] = v;
    };


    // inlined manually
    // const SMALLEST = 1;

    /* ===========================================================================
     * Send the block data compressed using the given Huffman trees
     */
    const compress_block = (s, ltree, dtree) =>
    //    deflate_state *s;
    //    const ct_data *ltree; /* literal tree */
    //    const ct_data *dtree; /* distance tree */
    {
      let dist;           /* distance of matched string */
      let lc;             /* match length or unmatched char (if dist == 0) */
      let lx = 0;         /* running index in l_buf */
      let code;           /* the code to send */
      let extra;          /* number of extra bits to send */

      if (s.last_lit !== 0) {
        do {
          dist = (s.pending_buf[s.d_buf + lx * 2] << 8) | (s.pending_buf[s.d_buf + lx * 2 + 1]);
          lc = s.pending_buf[s.l_buf + lx];
          lx++;

          if (dist === 0) {
            send_code(s, lc, ltree); /* send a literal byte */
            //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
          } else {
            /* Here, lc is the match length - MIN_MATCH */
            code = _length_code[lc];
            send_code(s, code + LITERALS + 1, ltree); /* send the length code */
            extra = extra_lbits[code];
            if (extra !== 0) {
              lc -= base_length[code];
              send_bits(s, lc, extra);       /* send the extra length bits */
            }
            dist--; /* dist is now the match distance - 1 */
            code = d_code(dist);
            //Assert (code < D_CODES, "bad d_code");

            send_code(s, code, dtree);       /* send the distance code */
            extra = extra_dbits[code];
            if (extra !== 0) {
              dist -= base_dist[code];
              send_bits(s, dist, extra);   /* send the extra distance bits */
            }
          } /* literal or match pair ? */

          /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
          //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
          //       "pendingBuf overflow");

        } while (lx < s.last_lit);
      }

      send_code(s, END_BLOCK, ltree);
    };


    /* ===========================================================================
     * Construct one Huffman tree and assigns the code bit strings and lengths.
     * Update the total bit length for the current block.
     * IN assertion: the field freq is set for all tree elements.
     * OUT assertions: the fields len and code are set to the optimal bit length
     *     and corresponding code. The length opt_len is updated; static_len is
     *     also updated if stree is not null. The field max_code is set.
     */
    const build_tree = (s, desc) =>
    //    deflate_state *s;
    //    tree_desc *desc; /* the tree descriptor */
    {
      const tree     = desc.dyn_tree;
      const stree    = desc.stat_desc.static_tree;
      const has_stree = desc.stat_desc.has_stree;
      const elems    = desc.stat_desc.elems;
      let n, m;          /* iterate over heap elements */
      let max_code = -1; /* largest code with non zero frequency */
      let node;          /* new node being created */

      /* Construct the initial heap, with least frequent element in
       * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
       * heap[0] is not used.
       */
      s.heap_len = 0;
      s.heap_max = HEAP_SIZE;

      for (n = 0; n < elems; n++) {
        if (tree[n * 2]/*.Freq*/ !== 0) {
          s.heap[++s.heap_len] = max_code = n;
          s.depth[n] = 0;

        } else {
          tree[n * 2 + 1]/*.Len*/ = 0;
        }
      }

      /* The pkzip format requires that at least one distance code exists,
       * and that at least one bit should be sent even if there is only one
       * possible code. So to avoid special checks later on we force at least
       * two codes of non zero frequency.
       */
      while (s.heap_len < 2) {
        node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
        tree[node * 2]/*.Freq*/ = 1;
        s.depth[node] = 0;
        s.opt_len--;

        if (has_stree) {
          s.static_len -= stree[node * 2 + 1]/*.Len*/;
        }
        /* node is 0 or 1 so it does not have extra bits */
      }
      desc.max_code = max_code;

      /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
       * establish sub-heaps of increasing lengths:
       */
      for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

      /* Construct the Huffman tree by repeatedly combining the least two
       * frequent nodes.
       */
      node = elems;              /* next internal node of the tree */
      do {
        //pqremove(s, tree, n);  /* n = node of least frequency */
        /*** pqremove ***/
        n = s.heap[1/*SMALLEST*/];
        s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
        pqdownheap(s, tree, 1/*SMALLEST*/);
        /***/

        m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

        s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
        s.heap[--s.heap_max] = m;

        /* Create a new node father of n and m */
        tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
        s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
        tree[n * 2 + 1]/*.Dad*/ = tree[m * 2 + 1]/*.Dad*/ = node;

        /* and insert the new node in the heap */
        s.heap[1/*SMALLEST*/] = node++;
        pqdownheap(s, tree, 1/*SMALLEST*/);

      } while (s.heap_len >= 2);

      s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

      /* At this point, the fields freq and dad are set. We can now
       * generate the bit lengths.
       */
      gen_bitlen(s, desc);

      /* The field len is now set, we can generate the bit codes */
      gen_codes(tree, max_code, s.bl_count);
    };


    /* ===========================================================================
     * Scan a literal or distance tree to determine the frequencies of the codes
     * in the bit length tree.
     */
    const scan_tree = (s, tree, max_code) =>
    //    deflate_state *s;
    //    ct_data *tree;   /* the tree to be scanned */
    //    int max_code;    /* and its largest code of non zero frequency */
    {
      let n;                     /* iterates over all tree elements */
      let prevlen = -1;          /* last emitted length */
      let curlen;                /* length of current code */

      let nextlen = tree[0 * 2 + 1]/*.Len*/; /* length of next code */

      let count = 0;             /* repeat count of the current code */
      let max_count = 7;         /* max repeat count */
      let min_count = 4;         /* min repeat count */

      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      tree[(max_code + 1) * 2 + 1]/*.Len*/ = 0xffff; /* guard */

      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

        if (++count < max_count && curlen === nextlen) {
          continue;

        } else if (count < min_count) {
          s.bl_tree[curlen * 2]/*.Freq*/ += count;

        } else if (curlen !== 0) {

          if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
          s.bl_tree[REP_3_6 * 2]/*.Freq*/++;

        } else if (count <= 10) {
          s.bl_tree[REPZ_3_10 * 2]/*.Freq*/++;

        } else {
          s.bl_tree[REPZ_11_138 * 2]/*.Freq*/++;
        }

        count = 0;
        prevlen = curlen;

        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;

        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;

        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    };


    /* ===========================================================================
     * Send a literal or distance tree in compressed form, using the codes in
     * bl_tree.
     */
    const send_tree = (s, tree, max_code) =>
    //    deflate_state *s;
    //    ct_data *tree; /* the tree to be scanned */
    //    int max_code;       /* and its largest code of non zero frequency */
    {
      let n;                     /* iterates over all tree elements */
      let prevlen = -1;          /* last emitted length */
      let curlen;                /* length of current code */

      let nextlen = tree[0 * 2 + 1]/*.Len*/; /* length of next code */

      let count = 0;             /* repeat count of the current code */
      let max_count = 7;         /* max repeat count */
      let min_count = 4;         /* min repeat count */

      /* tree[max_code+1].Len = -1; */  /* guard already set */
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }

      for (n = 0; n <= max_code; n++) {
        curlen = nextlen;
        nextlen = tree[(n + 1) * 2 + 1]/*.Len*/;

        if (++count < max_count && curlen === nextlen) {
          continue;

        } else if (count < min_count) {
          do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            send_code(s, curlen, s.bl_tree);
            count--;
          }
          //Assert(count >= 3 && count <= 6, " 3_6?");
          send_code(s, REP_3_6, s.bl_tree);
          send_bits(s, count - 3, 2);

        } else if (count <= 10) {
          send_code(s, REPZ_3_10, s.bl_tree);
          send_bits(s, count - 3, 3);

        } else {
          send_code(s, REPZ_11_138, s.bl_tree);
          send_bits(s, count - 11, 7);
        }

        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;

        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;

        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    };


    /* ===========================================================================
     * Construct the Huffman tree for the bit lengths and return the index in
     * bl_order of the last bit length code to send.
     */
    const build_bl_tree = (s) => {

      let max_blindex;  /* index of last bit length code of non zero freq */

      /* Determine the bit length frequencies for literal and distance trees */
      scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
      scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

      /* Build the bit length tree: */
      build_tree(s, s.bl_desc);
      /* opt_len now includes the length of the tree representations, except
       * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
       */

      /* Determine the number of bit length codes to send. The pkzip format
       * requires that at least 4 bit length codes be sent. (appnote.txt says
       * 3 but the actual value used is 4.)
       */
      for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
        if (s.bl_tree[bl_order[max_blindex] * 2 + 1]/*.Len*/ !== 0) {
          break;
        }
      }
      /* Update opt_len to include the bit length tree and counts */
      s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
      //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
      //        s->opt_len, s->static_len));

      return max_blindex;
    };


    /* ===========================================================================
     * Send the header for a block using dynamic Huffman trees: the counts, the
     * lengths of the bit length codes, the literal tree and the distance tree.
     * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
     */
    const send_all_trees = (s, lcodes, dcodes, blcodes) =>
    //    deflate_state *s;
    //    int lcodes, dcodes, blcodes; /* number of codes for each tree */
    {
      let rank;                    /* index in bl_order */

      //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
      //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
      //        "too many codes");
      //Tracev((stderr, "\nbl counts: "));
      send_bits(s, lcodes - 257, 5); /* not +255 as stated in appnote.txt */
      send_bits(s, dcodes - 1,   5);
      send_bits(s, blcodes - 4,  4); /* not -3 as stated in appnote.txt */
      for (rank = 0; rank < blcodes; rank++) {
        //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
        send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1]/*.Len*/, 3);
      }
      //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

      send_tree(s, s.dyn_ltree, lcodes - 1); /* literal tree */
      //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

      send_tree(s, s.dyn_dtree, dcodes - 1); /* distance tree */
      //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
    };


    /* ===========================================================================
     * Check if the data type is TEXT or BINARY, using the following algorithm:
     * - TEXT if the two conditions below are satisfied:
     *    a) There are no non-portable control characters belonging to the
     *       "black list" (0..6, 14..25, 28..31).
     *    b) There is at least one printable character belonging to the
     *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
     * - BINARY otherwise.
     * - The following partially-portable control characters form a
     *   "gray list" that is ignored in this detection algorithm:
     *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
     * IN assertion: the fields Freq of dyn_ltree are set.
     */
    const detect_data_type = (s) => {
      /* black_mask is the bit mask of black-listed bytes
       * set bits 0..6, 14..25, and 28..31
       * 0xf3ffc07f = binary 11110011111111111100000001111111
       */
      let black_mask = 0xf3ffc07f;
      let n;

      /* Check for non-textual ("black-listed") bytes. */
      for (n = 0; n <= 31; n++, black_mask >>>= 1) {
        if ((black_mask & 1) && (s.dyn_ltree[n * 2]/*.Freq*/ !== 0)) {
          return Z_BINARY;
        }
      }

      /* Check for textual ("white-listed") bytes. */
      if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
          s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
        return Z_TEXT;
      }
      for (n = 32; n < LITERALS; n++) {
        if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
          return Z_TEXT;
        }
      }

      /* There are no "black-listed" or "white-listed" bytes:
       * this stream either is empty or has tolerated ("gray-listed") bytes only.
       */
      return Z_BINARY;
    };


    let static_init_done = false;

    /* ===========================================================================
     * Initialize the tree data structures for a new zlib stream.
     */
    const _tr_init = (s) =>
    {

      if (!static_init_done) {
        tr_static_init();
        static_init_done = true;
      }

      s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
      s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
      s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

      s.bi_buf = 0;
      s.bi_valid = 0;

      /* Initialize the first block of the first file: */
      init_block(s);
    };


    /* ===========================================================================
     * Send a stored block
     */
    const _tr_stored_block = (s, buf, stored_len, last) =>
    //DeflateState *s;
    //charf *buf;       /* input block */
    //ulg stored_len;   /* length of input block */
    //int last;         /* one if this is the last block for a file */
    {
      send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);    /* send block type */
      copy_block(s, buf, stored_len, true); /* with header */
    };


    /* ===========================================================================
     * Send one empty static block to give enough lookahead for inflate.
     * This takes 10 bits, of which 7 may remain in the bit buffer.
     */
    const _tr_align = (s) => {
      send_bits(s, STATIC_TREES << 1, 3);
      send_code(s, END_BLOCK, static_ltree);
      bi_flush(s);
    };


    /* ===========================================================================
     * Determine the best encoding for the current block: dynamic trees, static
     * trees or store, and output the encoded block to the zip file.
     */
    const _tr_flush_block = (s, buf, stored_len, last) =>
    //DeflateState *s;
    //charf *buf;       /* input block, or NULL if too old */
    //ulg stored_len;   /* length of input block */
    //int last;         /* one if this is the last block for a file */
    {
      let opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
      let max_blindex = 0;        /* index of last bit length code of non zero freq */

      /* Build the Huffman trees unless a stored block is forced */
      if (s.level > 0) {

        /* Check if the file is binary or text */
        if (s.strm.data_type === Z_UNKNOWN) {
          s.strm.data_type = detect_data_type(s);
        }

        /* Construct the literal and distance trees */
        build_tree(s, s.l_desc);
        // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
        //        s->static_len));

        build_tree(s, s.d_desc);
        // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
        //        s->static_len));
        /* At this point, opt_len and static_len are the total bit lengths of
         * the compressed block data, excluding the tree representations.
         */

        /* Build the bit length tree for the above two trees, and get the index
         * in bl_order of the last bit length code to send.
         */
        max_blindex = build_bl_tree(s);

        /* Determine the best encoding. Compute the block lengths in bytes. */
        opt_lenb = (s.opt_len + 3 + 7) >>> 3;
        static_lenb = (s.static_len + 3 + 7) >>> 3;

        // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
        //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
        //        s->last_lit));

        if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

      } else {
        // Assert(buf != (char*)0, "lost buf");
        opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
      }

      if ((stored_len + 4 <= opt_lenb) && (buf !== -1)) {
        /* 4: two words for the lengths */

        /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
         * Otherwise we can't have processed more than WSIZE input bytes since
         * the last block flush, because compression would have been
         * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
         * transform a block into a stored block.
         */
        _tr_stored_block(s, buf, stored_len, last);

      } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

        send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
        compress_block(s, static_ltree, static_dtree);

      } else {
        send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
        send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
        compress_block(s, s.dyn_ltree, s.dyn_dtree);
      }
      // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
      /* The above check is made mod 2^32, for files larger than 512 MB
       * and uLong implemented on 32 bits.
       */
      init_block(s);

      if (last) {
        bi_windup(s);
      }
      // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
      //       s->compressed_len-7*last));
    };

    /* ===========================================================================
     * Save the match info and tally the frequency counts. Return true if
     * the current block must be flushed.
     */
    const _tr_tally = (s, dist, lc) =>
    //    deflate_state *s;
    //    unsigned dist;  /* distance of matched string */
    //    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
    {
      //let out_length, in_length, dcode;

      s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
      s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

      s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
      s.last_lit++;

      if (dist === 0) {
        /* lc is the unmatched char */
        s.dyn_ltree[lc * 2]/*.Freq*/++;
      } else {
        s.matches++;
        /* Here, lc is the match length - MIN_MATCH */
        dist--;             /* dist = match distance - 1 */
        //Assert((ush)dist < (ush)MAX_DIST(s) &&
        //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
        //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

        s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]/*.Freq*/++;
        s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
      }

    // (!) This block is disabled in zlib defaults,
    // don't enable it for binary compatibility

    //#ifdef TRUNCATE_BLOCK
    //  /* Try to guess if it is profitable to stop the current block here */
    //  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
    //    /* Compute an upper bound for the compressed length */
    //    out_length = s.last_lit*8;
    //    in_length = s.strstart - s.block_start;
    //
    //    for (dcode = 0; dcode < D_CODES; dcode++) {
    //      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
    //    }
    //    out_length >>>= 3;
    //    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
    //    //       s->last_lit, in_length, out_length,
    //    //       100L - out_length*100L/in_length));
    //    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
    //      return true;
    //    }
    //  }
    //#endif

      return (s.last_lit === s.lit_bufsize - 1);
      /* We avoid equality with lit_bufsize because of wraparound at 64K
       * on 16 bit machines and because stored blocks are restricted to
       * 64K-1 bytes.
       */
    };


    return compression.trees = {
        _tr_init,
        _tr_stored_block,
        _tr_flush_block,
        _tr_tally,
        _tr_align
    };


});
define('skylark-langx-compression/adler32',[
    "./compression"
], function (compression) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin


    // Note: adler32 takes 12% for level 0 and 2% for level 6.
    // It isn't worth it to make additional optimizations as in original.
    // Small size is preferable.
    function adler32 (adler, buf, len, pos)  {
        let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
        while (len !== 0) {
            // Set limit ~ twice less than 5552, to keep
            // s2 in 31-bits, because we force signed ints.
            // in other case %= will fail.
            n = len > 2000 ? 2000 : len;
            len -= n;
            do {
                s1 = s1 + buf[pos++] | 0;
                s2 = s2 + s1 | 0;
            } while (--n);
            s1 %= 65521;
            s2 %= 65521;
        }
        return s1 | s2 << 16 | 0;
    };

    return compression.adler32 = adler32;

});
define('skylark-langx-compression/crc32',[
    "./compression"
], function (compression) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin

    // Note: we can't get significant speed boost here.
    // So write code to minimize size - no pregenerated tables
    // and array tools dependencies.
    
    // Use ordinary array, since untyped makes no boost here
    const makeTable = () => {
        let c, table = [];
        for (var n = 0; n < 256; n++) {
            c = n;
            for (var k = 0; k < 8; k++) {
                c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
            }
            table[n] = c;
        }
        return table;
    };
    
    // Create table on load. Just 255 signed longs. Not a problem.
    const crcTable = new Uint32Array(makeTable());

    const crc32 = (crc, buf, len, pos) => {
        const t = crcTable;
        const end = pos + len;
        crc ^= -1;
        for (let i = pos; i < end; i++) {
            crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
        }
        return crc ^ -1; // >>> 0;
    };


    return compression.crc32 = crc32;

});
define('skylark-langx-compression/messages',[
    "./compression"
], function (compression) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin

    return  compression.messages = {
      2:      'need dictionary',     /* Z_NEED_DICT       2  */
      1:      'stream end',          /* Z_STREAM_END      1  */
      0:      '',                    /* Z_OK              0  */
      '-1':   'file error',          /* Z_ERRNO         (-1) */
      '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
      '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
      '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
      '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
      '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
    };

});
define('skylark-langx-compression/deflates',[
    "./compression",
    './trees',
    './adler32',
    './crc32',
    './messages',
    './constants'
], function (compression,trees, adler32, crc32, msg, constants) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin


    const {
        _tr_init, 
        _tr_stored_block, 
        _tr_flush_block, 
        _tr_tally, 
        _tr_align
    } = trees;

    /* Public constants ==========================================================*/
    /* ===========================================================================*/
    const {
        Z_NO_FLUSH, 
        Z_PARTIAL_FLUSH, 
        Z_FULL_FLUSH, 
        Z_FINISH, 
        Z_BLOCK, 
        Z_OK, 
        Z_STREAM_END, 
        Z_STREAM_ERROR, 
        Z_DATA_ERROR, 
        Z_BUF_ERROR, 
        Z_DEFAULT_COMPRESSION, 
        Z_FILTERED, 
        Z_HUFFMAN_ONLY, 
        Z_RLE, Z_FIXED, 
        Z_DEFAULT_STRATEGY, 
        Z_UNKNOWN, 
        Z_DEFLATED
    } = constants;
    /*============================================================================*/


    const MAX_MEM_LEVEL = 9;
    /* Maximum value for memLevel in deflateInit2 */
    const MAX_WBITS = 15;
    /* 32K LZ77 window */
    const DEF_MEM_LEVEL = 8;


    const LENGTH_CODES  = 29;
    /* number of length codes, not counting the special END_BLOCK code */
    const LITERALS      = 256;
    /* number of literal bytes 0..255 */
    const L_CODES       = LITERALS + 1 + LENGTH_CODES;
    /* number of Literal or Length codes, including the END_BLOCK code */
    const D_CODES       = 30;
    /* number of distance codes */
    const BL_CODES      = 19;
    /* number of codes used to transfer the bit lengths */
    const HEAP_SIZE     = 2 * L_CODES + 1;
    /* maximum heap size */
    const MAX_BITS  = 15;
    /* All codes must not exceed MAX_BITS bits */

    const MIN_MATCH = 3;
    const MAX_MATCH = 258;
    const MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

    const PRESET_DICT = 0x20;

    const INIT_STATE = 42;
    const EXTRA_STATE = 69;
    const NAME_STATE = 73;
    const COMMENT_STATE = 91;
    const HCRC_STATE = 103;
    const BUSY_STATE = 113;
    const FINISH_STATE = 666;

    const BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
    const BS_BLOCK_DONE     = 2; /* block flush performed */
    const BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
    const BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

    const OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

    const err = (strm, errorCode) => {
      strm.msg = msg[errorCode];
      return errorCode;
    };

    const rank = (f) => {
      return ((f) << 1) - ((f) > 4 ? 9 : 0);
    };

    const zero = (buf) => {
      let len = buf.length; while (--len >= 0) { buf[len] = 0; }
    };


    /* eslint-disable new-cap */
    let HASH_ZLIB = (s, prev, data) => ((prev << s.hash_shift) ^ data) & s.hash_mask;
    // This hash causes less collisions, https://github.com/nodeca/pako/issues/135
    // But breaks binary compatibility
    //let HASH_FAST = (s, prev, data) => ((prev << 8) + (prev >> 8) + (data << 4)) & s.hash_mask;
    let HASH = HASH_ZLIB;

    /* =========================================================================
     * Flush as much pending output as possible. All deflate() output goes
     * through this function so some applications may wish to modify it
     * to avoid allocating a large strm->output buffer and copying into it.
     * (See also read_buf()).
     */
    const flush_pending = (strm) => {
      const s = strm.state;

      //_tr_flush_bits(s);
      let len = s.pending;
      if (len > strm.avail_out) {
        len = strm.avail_out;
      }
      if (len === 0) { return; }

      strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
      strm.next_out += len;
      s.pending_out += len;
      strm.total_out += len;
      strm.avail_out -= len;
      s.pending -= len;
      if (s.pending === 0) {
        s.pending_out = 0;
      }
    };


    const flush_block_only = (s, last) => {
      _tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
      s.block_start = s.strstart;
      flush_pending(s.strm);
    };


    const put_byte = (s, b) => {
      s.pending_buf[s.pending++] = b;
    };


    /* =========================================================================
     * Put a short in the pending buffer. The 16-bit value is put in MSB order.
     * IN assertion: the stream state is correct and there is enough room in
     * pending_buf.
     */
    const putShortMSB = (s, b) => {

      //  put_byte(s, (Byte)(b >> 8));
    //  put_byte(s, (Byte)(b & 0xff));
      s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
      s.pending_buf[s.pending++] = b & 0xff;
    };


    /* ===========================================================================
     * Read a new buffer from the current input stream, update the adler32
     * and total number of bytes read.  All deflate() input goes through
     * this function so some applications may wish to modify it to avoid
     * allocating a large strm->input buffer and copying from it.
     * (See also flush_pending()).
     */
    const read_buf = (strm, buf, start, size) => {

      let len = strm.avail_in;

      if (len > size) { len = size; }
      if (len === 0) { return 0; }

      strm.avail_in -= len;

      // zmemcpy(buf, strm->next_in, len);
      buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
      if (strm.state.wrap === 1) {
        strm.adler = adler32(strm.adler, buf, len, start);
      }

      else if (strm.state.wrap === 2) {
        strm.adler = crc32(strm.adler, buf, len, start);
      }

      strm.next_in += len;
      strm.total_in += len;

      return len;
    };


    /* ===========================================================================
     * Set match_start to the longest match starting at the given string and
     * return its length. Matches shorter or equal to prev_length are discarded,
     * in which case the result is equal to prev_length and match_start is
     * garbage.
     * IN assertions: cur_match is the head of the hash chain for the current
     *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
     * OUT assertion: the match length is not greater than s->lookahead.
     */
    const longest_match = (s, cur_match) => {

      let chain_length = s.max_chain_length;      /* max hash chain length */
      let scan = s.strstart; /* current string */
      let match;                       /* matched string */
      let len;                           /* length of current match */
      let best_len = s.prev_length;              /* best match length so far */
      let nice_match = s.nice_match;             /* stop if match long enough */
      const limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
          s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

      const _win = s.window; // shortcut

      const wmask = s.w_mask;
      const prev  = s.prev;

      /* Stop when cur_match becomes <= limit. To simplify the code,
       * we prevent matches with the string of window index 0.
       */

      const strend = s.strstart + MAX_MATCH;
      let scan_end1  = _win[scan + best_len - 1];
      let scan_end   = _win[scan + best_len];

      /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
       * It is easy to get rid of this optimization if necessary.
       */
      // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

      /* Do not waste too much time if we already have a good match: */
      if (s.prev_length >= s.good_match) {
        chain_length >>= 2;
      }
      /* Do not look for matches beyond the end of the input. This is necessary
       * to make deflate deterministic.
       */
      if (nice_match > s.lookahead) { nice_match = s.lookahead; }

      // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

      do {
        // Assert(cur_match < s->strstart, "no future");
        match = cur_match;

        /* Skip to next match if the match length cannot increase
         * or if the match length is less than 2.  Note that the checks below
         * for insufficient lookahead only occur occasionally for performance
         * reasons.  Therefore uninitialized memory will be accessed, and
         * conditional jumps will be made that depend on those values.
         * However the length of the match is limited to the lookahead, so
         * the output of deflate is not affected by the uninitialized values.
         */

        if (_win[match + best_len]     !== scan_end  ||
            _win[match + best_len - 1] !== scan_end1 ||
            _win[match]                !== _win[scan] ||
            _win[++match]              !== _win[scan + 1]) {
          continue;
        }

        /* The check at best_len-1 can be removed because it will be made
         * again later. (This heuristic is not always a win.)
         * It is not necessary to compare scan[2] and match[2] since they
         * are always equal when the other bytes match, given that
         * the hash keys are equal and that HASH_BITS >= 8.
         */
        scan += 2;
        match++;
        // Assert(*scan == *match, "match[2]?");

        /* We check for insufficient lookahead only every 8th comparison;
         * the 256th check will be made at strstart+258.
         */
        do {
          /*jshint noempty:false*/
        } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                 _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                 _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                 _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
                 scan < strend);

        // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

        len = MAX_MATCH - (strend - scan);
        scan = strend - MAX_MATCH;

        if (len > best_len) {
          s.match_start = cur_match;
          best_len = len;
          if (len >= nice_match) {
            break;
          }
          scan_end1  = _win[scan + best_len - 1];
          scan_end   = _win[scan + best_len];
        }
      } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

      if (best_len <= s.lookahead) {
        return best_len;
      }
      return s.lookahead;
    };


    /* ===========================================================================
     * Fill the window when the lookahead becomes insufficient.
     * Updates strstart and lookahead.
     *
     * IN assertion: lookahead < MIN_LOOKAHEAD
     * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
     *    At least one byte has been read, or avail_in == 0; reads are
     *    performed for at least two bytes (required for the zip translate_eol
     *    option -- not supported here).
     */
    const fill_window = (s) => {

      const _w_size = s.w_size;
      let p, n, m, more, str;

      //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

      do {
        more = s.window_size - s.lookahead - s.strstart;

        // JS ints have 32 bit, block below not needed
        /* Deal with !@#$% 64K limit: */
        //if (sizeof(int) <= 2) {
        //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
        //        more = wsize;
        //
        //  } else if (more == (unsigned)(-1)) {
        //        /* Very unlikely, but possible on 16 bit machine if
        //         * strstart == 0 && lookahead == 1 (input done a byte at time)
        //         */
        //        more--;
        //    }
        //}


        /* If the window is almost full and there is insufficient lookahead,
         * move the upper half to the lower one to make room in the upper half.
         */
        if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

          s.window.set(s.window.subarray(_w_size, _w_size + _w_size), 0);
          s.match_start -= _w_size;
          s.strstart -= _w_size;
          /* we now have strstart >= MAX_DIST */
          s.block_start -= _w_size;

          /* Slide the hash table (could be avoided with 32 bit values
           at the expense of memory usage). We slide even when level == 0
           to keep the hash table consistent if we switch back to level > 0
           later. (Using level 0 permanently is not an optimal usage of
           zlib, so we don't care about this pathological case.)
           */

          n = s.hash_size;
          p = n;

          do {
            m = s.head[--p];
            s.head[p] = (m >= _w_size ? m - _w_size : 0);
          } while (--n);

          n = _w_size;
          p = n;

          do {
            m = s.prev[--p];
            s.prev[p] = (m >= _w_size ? m - _w_size : 0);
            /* If n is not on any hash chain, prev[n] is garbage but
             * its value will never be used.
             */
          } while (--n);

          more += _w_size;
        }
        if (s.strm.avail_in === 0) {
          break;
        }

        /* If there was no sliding:
         *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
         *    more == window_size - lookahead - strstart
         * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
         * => more >= window_size - 2*WSIZE + 2
         * In the BIG_MEM or MMAP case (not yet supported),
         *   window_size == input_size + MIN_LOOKAHEAD  &&
         *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
         * Otherwise, window_size == 2*WSIZE so more >= 2.
         * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
         */
        //Assert(more >= 2, "more < 2");
        n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
        s.lookahead += n;

        /* Initialize the hash value now that we have some input: */
        if (s.lookahead + s.insert >= MIN_MATCH) {
          str = s.strstart - s.insert;
          s.ins_h = s.window[str];

          /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
          s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
    //#if MIN_MATCH != 3
    //        Call update_hash() MIN_MATCH-3 more times
    //#endif
          while (s.insert) {
            /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
            s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);

            s.prev[str & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = str;
            str++;
            s.insert--;
            if (s.lookahead + s.insert < MIN_MATCH) {
              break;
            }
          }
        }
        /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
         * but this is not important since only literal bytes will be emitted.
         */

      } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

      /* If the WIN_INIT bytes after the end of the current data have never been
       * written, then zero those bytes in order to avoid memory check reports of
       * the use of uninitialized (or uninitialised as Julian writes) bytes by
       * the longest match routines.  Update the high water mark for the next
       * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
       * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
       */
    //  if (s.high_water < s.window_size) {
    //    const curr = s.strstart + s.lookahead;
    //    let init = 0;
    //
    //    if (s.high_water < curr) {
    //      /* Previous high water mark below current data -- zero WIN_INIT
    //       * bytes or up to end of window, whichever is less.
    //       */
    //      init = s.window_size - curr;
    //      if (init > WIN_INIT)
    //        init = WIN_INIT;
    //      zmemzero(s->window + curr, (unsigned)init);
    //      s->high_water = curr + init;
    //    }
    //    else if (s->high_water < (ulg)curr + WIN_INIT) {
    //      /* High water mark at or above current data, but below current data
    //       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
    //       * to end of window, whichever is less.
    //       */
    //      init = (ulg)curr + WIN_INIT - s->high_water;
    //      if (init > s->window_size - s->high_water)
    //        init = s->window_size - s->high_water;
    //      zmemzero(s->window + s->high_water, (unsigned)init);
    //      s->high_water += init;
    //    }
    //  }
    //
    //  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
    //    "not enough room for search");
    };

    /* ===========================================================================
     * Copy without compression as much as possible from the input stream, return
     * the current block state.
     * This function does not insert new strings in the dictionary since
     * uncompressible data is probably not useful. This function is used
     * only for the level=0 compression option.
     * NOTE: this function should be optimized to avoid extra copying from
     * window to pending_buf.
     */
    const deflate_stored = (s, flush) => {

      /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
       * to pending_buf_size, and each stored block has a 5 byte header:
       */
      let max_block_size = 0xffff;

      if (max_block_size > s.pending_buf_size - 5) {
        max_block_size = s.pending_buf_size - 5;
      }

      /* Copy as much as possible from input to output: */
      for (;;) {
        /* Fill the window as much as possible: */
        if (s.lookahead <= 1) {

          //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
          //  s->block_start >= (long)s->w_size, "slide too late");
    //      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
    //        s.block_start >= s.w_size)) {
    //        throw  new Error("slide too late");
    //      }

          fill_window(s);
          if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }

          if (s.lookahead === 0) {
            break;
          }
          /* flush the current block */
        }
        //Assert(s->block_start >= 0L, "block gone");
    //    if (s.block_start < 0) throw new Error("block gone");

        s.strstart += s.lookahead;
        s.lookahead = 0;

        /* Emit a stored block if pending_buf will be full: */
        const max_start = s.block_start + max_block_size;

        if (s.strstart === 0 || s.strstart >= max_start) {
          /* strstart == 0 is possible when wraparound on 16-bit machine */
          s.lookahead = s.strstart - max_start;
          s.strstart = max_start;
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/


        }
        /* Flush if we may have to slide, otherwise block_start may become
         * negative and the data will be gone:
         */
        if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/
        }
      }

      s.insert = 0;

      if (flush === Z_FINISH) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/
        return BS_FINISH_DONE;
      }

      if (s.strstart > s.block_start) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

      return BS_NEED_MORE;
    };

    /* ===========================================================================
     * Compress as much as possible from the input stream, return the current
     * block state.
     * This function does not perform lazy evaluation of matches and inserts
     * new strings in the dictionary only for unmatched strings or for short
     * matches. It is used only for the fast compression options.
     */
    const deflate_fast = (s, flush) => {

      let hash_head;        /* head of the hash chain */
      let bflush;           /* set if current block must be flushed */

      for (;;) {
        /* Make sure that we always have enough lookahead, except
         * at the end of the input file. We need MAX_MATCH bytes
         * for the next match, plus MIN_MATCH bytes to insert the
         * string following the next match.
         */
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);
          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break; /* flush the current block */
          }
        }

        /* Insert the string window[strstart .. strstart+2] in the
         * dictionary, and set hash_head to the head of the hash chain:
         */
        hash_head = 0/*NIL*/;
        if (s.lookahead >= MIN_MATCH) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }

        /* Find the longest match, discarding those <= prev_length.
         * At this point we have always match_length < MIN_MATCH
         */
        if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
          /* To simplify the code, we prevent matches with the string
           * of window index 0 (in particular we have to avoid a match
           * of the string with itself at the start of the input file).
           */
          s.match_length = longest_match(s, hash_head);
          /* longest_match() sets match_start */
        }
        if (s.match_length >= MIN_MATCH) {
          // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

          /*** _tr_tally_dist(s, s.strstart - s.match_start,
                         s.match_length - MIN_MATCH, bflush); ***/
          bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

          s.lookahead -= s.match_length;

          /* Insert new strings in the hash table only if the match length
           * is not too large. This saves time but degrades compression.
           */
          if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
            s.match_length--; /* string at strstart already in table */
            do {
              s.strstart++;
              /*** INSERT_STRING(s, s.strstart, hash_head); ***/
              s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
              /***/
              /* strstart never exceeds WSIZE-MAX_MATCH, so there are
               * always MIN_MATCH bytes ahead.
               */
            } while (--s.match_length !== 0);
            s.strstart++;
          } else
          {
            s.strstart += s.match_length;
            s.match_length = 0;
            s.ins_h = s.window[s.strstart];
            /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);

    //#if MIN_MATCH != 3
    //                Call UPDATE_HASH() MIN_MATCH-3 more times
    //#endif
            /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
             * matter since it will be recomputed at next deflate call.
             */
          }
        } else {
          /* No match, output a literal byte */
          //Tracevv((stderr,"%c", s.window[s.strstart]));
          /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
          bflush = _tr_tally(s, 0, s.window[s.strstart]);

          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/
        }
      }
      s.insert = ((s.strstart < (MIN_MATCH - 1)) ? s.strstart : MIN_MATCH - 1);
      if (flush === Z_FINISH) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }
      return BS_BLOCK_DONE;
    };

    /* ===========================================================================
     * Same as above, but achieves better compression. We use a lazy
     * evaluation for matches: a match is finally adopted only if there is
     * no better match at the next window position.
     */
    const deflate_slow = (s, flush) => {

      let hash_head;          /* head of hash chain */
      let bflush;              /* set if current block must be flushed */

      let max_insert;

      /* Process the input block. */
      for (;;) {
        /* Make sure that we always have enough lookahead, except
         * at the end of the input file. We need MAX_MATCH bytes
         * for the next match, plus MIN_MATCH bytes to insert the
         * string following the next match.
         */
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);
          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) { break; } /* flush the current block */
        }

        /* Insert the string window[strstart .. strstart+2] in the
         * dictionary, and set hash_head to the head of the hash chain:
         */
        hash_head = 0/*NIL*/;
        if (s.lookahead >= MIN_MATCH) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }

        /* Find the longest match, discarding those <= prev_length.
         */
        s.prev_length = s.match_length;
        s.prev_match = s.match_start;
        s.match_length = MIN_MATCH - 1;

        if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
            s.strstart - hash_head <= (s.w_size - MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
          /* To simplify the code, we prevent matches with the string
           * of window index 0 (in particular we have to avoid a match
           * of the string with itself at the start of the input file).
           */
          s.match_length = longest_match(s, hash_head);
          /* longest_match() sets match_start */

          if (s.match_length <= 5 &&
             (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

            /* If prev_match is also MIN_MATCH, match_start is garbage
             * but we will ignore the current match anyway.
             */
            s.match_length = MIN_MATCH - 1;
          }
        }
        /* If there was a match at the previous step and the current
         * match is not better, output the previous match:
         */
        if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
          max_insert = s.strstart + s.lookahead - MIN_MATCH;
          /* Do not insert strings in hash table beyond this. */

          //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

          /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                         s.prev_length - MIN_MATCH, bflush);***/
          bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
          /* Insert in hash table all strings up to the end of the match.
           * strstart-1 and strstart are already inserted. If there is not
           * enough lookahead, the last two strings are not inserted in
           * the hash table.
           */
          s.lookahead -= s.prev_length - 1;
          s.prev_length -= 2;
          do {
            if (++s.strstart <= max_insert) {
              /*** INSERT_STRING(s, s.strstart, hash_head); ***/
              s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
              /***/
            }
          } while (--s.prev_length !== 0);
          s.match_available = 0;
          s.match_length = MIN_MATCH - 1;
          s.strstart++;

          if (bflush) {
            /*** FLUSH_BLOCK(s, 0); ***/
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
            /***/
          }

        } else if (s.match_available) {
          /* If there was no match at the previous position, output a
           * single literal. If there was a match but the current match
           * is longer, truncate the previous match to a single literal.
           */
          //Tracevv((stderr,"%c", s->window[s->strstart-1]));
          /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
          bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);

          if (bflush) {
            /*** FLUSH_BLOCK_ONLY(s, 0) ***/
            flush_block_only(s, false);
            /***/
          }
          s.strstart++;
          s.lookahead--;
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        } else {
          /* There is no previous match to compare with, wait for
           * the next step to decide.
           */
          s.match_available = 1;
          s.strstart++;
          s.lookahead--;
        }
      }
      //Assert (flush != Z_NO_FLUSH, "no flush?");
      if (s.match_available) {
        //Tracevv((stderr,"%c", s->window[s->strstart-1]));
        /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
        bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);

        s.match_available = 0;
      }
      s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

      return BS_BLOCK_DONE;
    };


    /* ===========================================================================
     * For Z_RLE, simply look for runs of bytes, generate matches only of distance
     * one.  Do not maintain a hash table.  (It will be regenerated if this run of
     * deflate switches away from Z_RLE.)
     */
    const deflate_rle = (s, flush) => {

      let bflush;            /* set if current block must be flushed */
      let prev;              /* byte at distance one to match */
      let scan, strend;      /* scan goes up to strend for length of run */

      const _win = s.window;

      for (;;) {
        /* Make sure that we always have enough lookahead, except
         * at the end of the input file. We need MAX_MATCH bytes
         * for the longest run, plus one for the unrolled loop.
         */
        if (s.lookahead <= MAX_MATCH) {
          fill_window(s);
          if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) { break; } /* flush the current block */
        }

        /* See how many times the previous byte repeats */
        s.match_length = 0;
        if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
          scan = s.strstart - 1;
          prev = _win[scan];
          if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
            strend = s.strstart + MAX_MATCH;
            do {
              /*jshint noempty:false*/
            } while (prev === _win[++scan] && prev === _win[++scan] &&
                     prev === _win[++scan] && prev === _win[++scan] &&
                     prev === _win[++scan] && prev === _win[++scan] &&
                     prev === _win[++scan] && prev === _win[++scan] &&
                     scan < strend);
            s.match_length = MAX_MATCH - (strend - scan);
            if (s.match_length > s.lookahead) {
              s.match_length = s.lookahead;
            }
          }
          //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
        }

        /* Emit match if have run of MIN_MATCH or longer, else emit literal */
        if (s.match_length >= MIN_MATCH) {
          //check_match(s, s.strstart, s.strstart - 1, s.match_length);

          /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
          bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);

          s.lookahead -= s.match_length;
          s.strstart += s.match_length;
          s.match_length = 0;
        } else {
          /* No match, output a literal byte */
          //Tracevv((stderr,"%c", s->window[s->strstart]));
          /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
          bflush = _tr_tally(s, 0, s.window[s.strstart]);

          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }
      return BS_BLOCK_DONE;
    };

    /* ===========================================================================
     * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
     * (It will be regenerated if this run of deflate switches away from Huffman.)
     */
    const deflate_huff = (s, flush) => {

      let bflush;             /* set if current block must be flushed */

      for (;;) {
        /* Make sure that we have a literal to write. */
        if (s.lookahead === 0) {
          fill_window(s);
          if (s.lookahead === 0) {
            if (flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            break;      /* flush the current block */
          }
        }

        /* Output a literal byte */
        s.match_length = 0;
        //Tracevv((stderr,"%c", s->window[s->strstart]));
        /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
        if (bflush) {
          /*** FLUSH_BLOCK(s, 0); ***/
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
          /***/
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH) {
        /*** FLUSH_BLOCK(s, 1); ***/
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        /***/
        return BS_FINISH_DONE;
      }
      if (s.last_lit) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }
      return BS_BLOCK_DONE;
    };

    /* Values for max_lazy_match, good_match and max_chain_length, depending on
     * the desired pack level (0..9). The values given below have been tuned to
     * exclude worst case performance for pathological files. Better values may be
     * found for specific files.
     */
    function Config(good_length, max_lazy, nice_length, max_chain, func) {

      this.good_length = good_length;
      this.max_lazy = max_lazy;
      this.nice_length = nice_length;
      this.max_chain = max_chain;
      this.func = func;
    }

    const configuration_table = [
      /*      good lazy nice chain */
      new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
      new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
      new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
      new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

      new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
      new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
      new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
      new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
      new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
      new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
    ];


    /* ===========================================================================
     * Initialize the "longest match" routines for a new zlib stream
     */
    const lm_init = (s) => {

      s.window_size = 2 * s.w_size;

      /*** CLEAR_HASH(s); ***/
      zero(s.head); // Fill with NIL (= 0);

      /* Set the default configuration parameters:
       */
      s.max_lazy_match = configuration_table[s.level].max_lazy;
      s.good_match = configuration_table[s.level].good_length;
      s.nice_match = configuration_table[s.level].nice_length;
      s.max_chain_length = configuration_table[s.level].max_chain;

      s.strstart = 0;
      s.block_start = 0;
      s.lookahead = 0;
      s.insert = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      s.ins_h = 0;
    };


    function DeflateState() {
      this.strm = null;            /* pointer back to this zlib stream */
      this.status = 0;            /* as the name implies */
      this.pending_buf = null;      /* output still pending */
      this.pending_buf_size = 0;  /* size of pending_buf */
      this.pending_out = 0;       /* next pending byte to output to the stream */
      this.pending = 0;           /* nb of bytes in the pending buffer */
      this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
      this.gzhead = null;         /* gzip header information to write */
      this.gzindex = 0;           /* where in extra, name, or comment */
      this.method = Z_DEFLATED; /* can only be DEFLATED */
      this.last_flush = -1;   /* value of flush param for previous deflate call */

      this.w_size = 0;  /* LZ77 window size (32K by default) */
      this.w_bits = 0;  /* log2(w_size)  (8..16) */
      this.w_mask = 0;  /* w_size - 1 */

      this.window = null;
      /* Sliding window. Input bytes are read into the second half of the window,
       * and move to the first half later to keep a dictionary of at least wSize
       * bytes. With this organization, matches are limited to a distance of
       * wSize-MAX_MATCH bytes, but this ensures that IO is always
       * performed with a length multiple of the block size.
       */

      this.window_size = 0;
      /* Actual size of window: 2*wSize, except when the user input buffer
       * is directly used as sliding window.
       */

      this.prev = null;
      /* Link to older string with same hash index. To limit the size of this
       * array to 64K, this link is maintained only for the last 32K strings.
       * An index in this array is thus a window index modulo 32K.
       */

      this.head = null;   /* Heads of the hash chains or NIL. */

      this.ins_h = 0;       /* hash index of string to be inserted */
      this.hash_size = 0;   /* number of elements in hash table */
      this.hash_bits = 0;   /* log2(hash_size) */
      this.hash_mask = 0;   /* hash_size-1 */

      this.hash_shift = 0;
      /* Number of bits by which ins_h must be shifted at each input
       * step. It must be such that after MIN_MATCH steps, the oldest
       * byte no longer takes part in the hash key, that is:
       *   hash_shift * MIN_MATCH >= hash_bits
       */

      this.block_start = 0;
      /* Window position at the beginning of the current output block. Gets
       * negative when the window is moved backwards.
       */

      this.match_length = 0;      /* length of best match */
      this.prev_match = 0;        /* previous match */
      this.match_available = 0;   /* set if previous match exists */
      this.strstart = 0;          /* start of string to insert */
      this.match_start = 0;       /* start of matching string */
      this.lookahead = 0;         /* number of valid bytes ahead in window */

      this.prev_length = 0;
      /* Length of the best match at previous step. Matches not greater than this
       * are discarded. This is used in the lazy match evaluation.
       */

      this.max_chain_length = 0;
      /* To speed up deflation, hash chains are never searched beyond this
       * length.  A higher limit improves compression ratio but degrades the
       * speed.
       */

      this.max_lazy_match = 0;
      /* Attempt to find a better match only when the current match is strictly
       * smaller than this value. This mechanism is used only for compression
       * levels >= 4.
       */
      // That's alias to max_lazy_match, don't use directly
      //this.max_insert_length = 0;
      /* Insert new strings in the hash table only if the match length is not
       * greater than this length. This saves time but degrades compression.
       * max_insert_length is used only for compression levels <= 3.
       */

      this.level = 0;     /* compression level (1..9) */
      this.strategy = 0;  /* favor or force Huffman coding*/

      this.good_match = 0;
      /* Use a faster search when the previous match is longer than this */

      this.nice_match = 0; /* Stop searching when current match exceeds this */

                  /* used by trees.c: */

      /* Didn't use ct_data typedef below to suppress compiler warning */

      // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
      // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
      // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

      // Use flat array of DOUBLE size, with interleaved fata,
      // because JS does not support effective
      this.dyn_ltree  = new Uint16Array(HEAP_SIZE * 2);
      this.dyn_dtree  = new Uint16Array((2 * D_CODES + 1) * 2);
      this.bl_tree    = new Uint16Array((2 * BL_CODES + 1) * 2);
      zero(this.dyn_ltree);
      zero(this.dyn_dtree);
      zero(this.bl_tree);

      this.l_desc   = null;         /* desc. for literal tree */
      this.d_desc   = null;         /* desc. for distance tree */
      this.bl_desc  = null;         /* desc. for bit length tree */

      //ush bl_count[MAX_BITS+1];
      this.bl_count = new Uint16Array(MAX_BITS + 1);
      /* number of codes at each bit length for an optimal tree */

      //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
      this.heap = new Uint16Array(2 * L_CODES + 1);  /* heap used to build the Huffman trees */
      zero(this.heap);

      this.heap_len = 0;               /* number of elements in the heap */
      this.heap_max = 0;               /* element of largest frequency */
      /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
       * The same heap array is used to build all trees.
       */

      this.depth = new Uint16Array(2 * L_CODES + 1); //uch depth[2*L_CODES+1];
      zero(this.depth);
      /* Depth of each subtree used as tie breaker for trees of equal frequency
       */

      this.l_buf = 0;          /* buffer index for literals or lengths */

      this.lit_bufsize = 0;
      /* Size of match buffer for literals/lengths.  There are 4 reasons for
       * limiting lit_bufsize to 64K:
       *   - frequencies can be kept in 16 bit counters
       *   - if compression is not successful for the first block, all input
       *     data is still in the window so we can still emit a stored block even
       *     when input comes from standard input.  (This can also be done for
       *     all blocks if lit_bufsize is not greater than 32K.)
       *   - if compression is not successful for a file smaller than 64K, we can
       *     even emit a stored file instead of a stored block (saving 5 bytes).
       *     This is applicable only for zip (not gzip or zlib).
       *   - creating new Huffman trees less frequently may not provide fast
       *     adaptation to changes in the input data statistics. (Take for
       *     example a binary file with poorly compressible code followed by
       *     a highly compressible string table.) Smaller buffer sizes give
       *     fast adaptation but have of course the overhead of transmitting
       *     trees more frequently.
       *   - I can't count above 4
       */

      this.last_lit = 0;      /* running index in l_buf */

      this.d_buf = 0;
      /* Buffer index for distances. To simplify the code, d_buf and l_buf have
       * the same number of elements. To use different lengths, an extra flag
       * array would be necessary.
       */

      this.opt_len = 0;       /* bit length of current block with optimal trees */
      this.static_len = 0;    /* bit length of current block with static trees */
      this.matches = 0;       /* number of string matches in current block */
      this.insert = 0;        /* bytes at end of window left to insert */


      this.bi_buf = 0;
      /* Output buffer. bits are inserted starting at the bottom (least
       * significant bits).
       */
      this.bi_valid = 0;
      /* Number of valid bits in bi_buf.  All bits above the last valid bit
       * are always zero.
       */

      // Used for window memory init. We safely ignore it for JS. That makes
      // sense only for pointers and memory check tools.
      //this.high_water = 0;
      /* High water mark offset in window for initialized bytes -- bytes above
       * this are set to zero in order to avoid memory check warnings when
       * longest match routines access bytes past the input.  This is then
       * updated to the new high water mark.
       */
    }


    const deflateResetKeep = (strm) => {

      if (!strm || !strm.state) {
        return err(strm, Z_STREAM_ERROR);
      }

      strm.total_in = strm.total_out = 0;
      strm.data_type = Z_UNKNOWN;

      const s = strm.state;
      s.pending = 0;
      s.pending_out = 0;

      if (s.wrap < 0) {
        s.wrap = -s.wrap;
        /* was made negative by deflate(..., Z_FINISH); */
      }
      s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
      strm.adler = (s.wrap === 2) ?
        0  // crc32(0, Z_NULL, 0)
      :
        1; // adler32(0, Z_NULL, 0)
      s.last_flush = Z_NO_FLUSH;
      _tr_init(s);
      return Z_OK;
    };


    const deflateReset = (strm) => {

      const ret = deflateResetKeep(strm);
      if (ret === Z_OK) {
        lm_init(strm.state);
      }
      return ret;
    };


    const deflateSetHeader = (strm, head) => {

      if (!strm || !strm.state) { return Z_STREAM_ERROR; }
      if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
      strm.state.gzhead = head;
      return Z_OK;
    };


    const deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {

      if (!strm) { // === Z_NULL
        return Z_STREAM_ERROR;
      }
      let wrap = 1;

      if (level === Z_DEFAULT_COMPRESSION) {
        level = 6;
      }

      if (windowBits < 0) { /* suppress zlib wrapper */
        wrap = 0;
        windowBits = -windowBits;
      }

      else if (windowBits > 15) {
        wrap = 2;           /* write gzip wrapper instead */
        windowBits -= 16;
      }


      if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
        windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
        strategy < 0 || strategy > Z_FIXED) {
        return err(strm, Z_STREAM_ERROR);
      }


      if (windowBits === 8) {
        windowBits = 9;
      }
      /* until 256-byte window bug fixed */

      const s = new DeflateState();

      strm.state = s;
      s.strm = strm;

      s.wrap = wrap;
      s.gzhead = null;
      s.w_bits = windowBits;
      s.w_size = 1 << s.w_bits;
      s.w_mask = s.w_size - 1;

      s.hash_bits = memLevel + 7;
      s.hash_size = 1 << s.hash_bits;
      s.hash_mask = s.hash_size - 1;
      s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

      s.window = new Uint8Array(s.w_size * 2);
      s.head = new Uint16Array(s.hash_size);
      s.prev = new Uint16Array(s.w_size);

      // Don't need mem init magic for JS.
      //s.high_water = 0;  /* nothing written to s->window yet */

      s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

      s.pending_buf_size = s.lit_bufsize * 4;

      //overlay = (ushf *) ZALLOC(strm, s->lit_bufsize, sizeof(ush)+2);
      //s->pending_buf = (uchf *) overlay;
      s.pending_buf = new Uint8Array(s.pending_buf_size);

      // It is offset from `s.pending_buf` (size is `s.lit_bufsize * 2`)
      //s->d_buf = overlay + s->lit_bufsize/sizeof(ush);
      s.d_buf = 1 * s.lit_bufsize;

      //s->l_buf = s->pending_buf + (1+sizeof(ush))*s->lit_bufsize;
      s.l_buf = (1 + 2) * s.lit_bufsize;

      s.level = level;
      s.strategy = strategy;
      s.method = method;

      return deflateReset(strm);
    };

    const deflateInit = (strm, level) => {

      return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
    };


    const deflate = (strm, flush) => {

      let beg, val; // for gzip header write only

      if (!strm || !strm.state ||
        flush > Z_BLOCK || flush < 0) {
        return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
      }

      const s = strm.state;

      if (!strm.output ||
          (!strm.input && strm.avail_in !== 0) ||
          (s.status === FINISH_STATE && flush !== Z_FINISH)) {
        return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
      }

      s.strm = strm; /* just in case */
      const old_flush = s.last_flush;
      s.last_flush = flush;

      /* Write the header */
      if (s.status === INIT_STATE) {

        if (s.wrap === 2) { // GZIP header
          strm.adler = 0;  //crc32(0L, Z_NULL, 0);
          put_byte(s, 31);
          put_byte(s, 139);
          put_byte(s, 8);
          if (!s.gzhead) { // s->gzhead == Z_NULL
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, 0);
            put_byte(s, s.level === 9 ? 2 :
                        (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                         4 : 0));
            put_byte(s, OS_CODE);
            s.status = BUSY_STATE;
          }
          else {
            put_byte(s, (s.gzhead.text ? 1 : 0) +
                        (s.gzhead.hcrc ? 2 : 0) +
                        (!s.gzhead.extra ? 0 : 4) +
                        (!s.gzhead.name ? 0 : 8) +
                        (!s.gzhead.comment ? 0 : 16)
            );
            put_byte(s, s.gzhead.time & 0xff);
            put_byte(s, (s.gzhead.time >> 8) & 0xff);
            put_byte(s, (s.gzhead.time >> 16) & 0xff);
            put_byte(s, (s.gzhead.time >> 24) & 0xff);
            put_byte(s, s.level === 9 ? 2 :
                        (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                         4 : 0));
            put_byte(s, s.gzhead.os & 0xff);
            if (s.gzhead.extra && s.gzhead.extra.length) {
              put_byte(s, s.gzhead.extra.length & 0xff);
              put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
            }
            if (s.gzhead.hcrc) {
              strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
            }
            s.gzindex = 0;
            s.status = EXTRA_STATE;
          }
        }
        else // DEFLATE header
        {
          let header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
          let level_flags = -1;

          if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
            level_flags = 0;
          } else if (s.level < 6) {
            level_flags = 1;
          } else if (s.level === 6) {
            level_flags = 2;
          } else {
            level_flags = 3;
          }
          header |= (level_flags << 6);
          if (s.strstart !== 0) { header |= PRESET_DICT; }
          header += 31 - (header % 31);

          s.status = BUSY_STATE;
          putShortMSB(s, header);

          /* Save the adler32 of the preset dictionary: */
          if (s.strstart !== 0) {
            putShortMSB(s, strm.adler >>> 16);
            putShortMSB(s, strm.adler & 0xffff);
          }
          strm.adler = 1; // adler32(0L, Z_NULL, 0);
        }
      }

    //#ifdef GZIP
      if (s.status === EXTRA_STATE) {
        if (s.gzhead.extra/* != Z_NULL*/) {
          beg = s.pending;  /* start of bytes to update crc */

          while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                break;
              }
            }
            put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
            s.gzindex++;
          }
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (s.gzindex === s.gzhead.extra.length) {
            s.gzindex = 0;
            s.status = NAME_STATE;
          }
        }
        else {
          s.status = NAME_STATE;
        }
      }
      if (s.status === NAME_STATE) {
        if (s.gzhead.name/* != Z_NULL*/) {
          beg = s.pending;  /* start of bytes to update crc */
          //int val;

          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            }
            // JS specific: little magic to add zero terminator to end of string
            if (s.gzindex < s.gzhead.name.length) {
              val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);

          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (val === 0) {
            s.gzindex = 0;
            s.status = COMMENT_STATE;
          }
        }
        else {
          s.status = COMMENT_STATE;
        }
      }
      if (s.status === COMMENT_STATE) {
        if (s.gzhead.comment/* != Z_NULL*/) {
          beg = s.pending;  /* start of bytes to update crc */
          //int val;

          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              beg = s.pending;
              if (s.pending === s.pending_buf_size) {
                val = 1;
                break;
              }
            }
            // JS specific: little magic to add zero terminator to end of string
            if (s.gzindex < s.gzhead.comment.length) {
              val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);

          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          if (val === 0) {
            s.status = HCRC_STATE;
          }
        }
        else {
          s.status = HCRC_STATE;
        }
      }
      if (s.status === HCRC_STATE) {
        if (s.gzhead.hcrc) {
          if (s.pending + 2 > s.pending_buf_size) {
            flush_pending(strm);
          }
          if (s.pending + 2 <= s.pending_buf_size) {
            put_byte(s, strm.adler & 0xff);
            put_byte(s, (strm.adler >> 8) & 0xff);
            strm.adler = 0; //crc32(0L, Z_NULL, 0);
            s.status = BUSY_STATE;
          }
        }
        else {
          s.status = BUSY_STATE;
        }
      }
    //#endif

      /* Flush as much pending output as possible */
      if (s.pending !== 0) {
        flush_pending(strm);
        if (strm.avail_out === 0) {
          /* Since avail_out is 0, deflate will be called again with
           * more output space, but possibly with both pending and
           * avail_in equal to zero. There won't be anything to do,
           * but this is not an error situation so make sure we
           * return OK instead of BUF_ERROR at next call of deflate:
           */
          s.last_flush = -1;
          return Z_OK;
        }

        /* Make sure there is something to do and avoid duplicate consecutive
         * flushes. For repeated and useless calls with Z_FINISH, we keep
         * returning Z_STREAM_END instead of Z_BUF_ERROR.
         */
      } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
        flush !== Z_FINISH) {
        return err(strm, Z_BUF_ERROR);
      }

      /* User must not provide more input after the first FINISH: */
      if (s.status === FINISH_STATE && strm.avail_in !== 0) {
        return err(strm, Z_BUF_ERROR);
      }

      /* Start a new block or continue the current one.
       */
      if (strm.avail_in !== 0 || s.lookahead !== 0 ||
        (flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
        let bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
          (s.strategy === Z_RLE ? deflate_rle(s, flush) :
            configuration_table[s.level].func(s, flush));

        if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
          s.status = FINISH_STATE;
        }
        if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            /* avoid BUF_ERROR next call, see above */
          }
          return Z_OK;
          /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
           * of deflate should use the same flush parameter to make sure
           * that the flush is complete. So we don't have to output an
           * empty block here, this will be done at next call. This also
           * ensures that for a very small output buffer, we emit at most
           * one empty block.
           */
        }
        if (bstate === BS_BLOCK_DONE) {
          if (flush === Z_PARTIAL_FLUSH) {
            _tr_align(s);
          }
          else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

            _tr_stored_block(s, 0, 0, false);
            /* For a full flush, this empty block will be recognized
             * as a special marker by inflate_sync().
             */
            if (flush === Z_FULL_FLUSH) {
              /*** CLEAR_HASH(s); ***/             /* forget history */
              zero(s.head); // Fill with NIL (= 0);

              if (s.lookahead === 0) {
                s.strstart = 0;
                s.block_start = 0;
                s.insert = 0;
              }
            }
          }
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
            return Z_OK;
          }
        }
      }
      //Assert(strm->avail_out > 0, "bug2");
      //if (strm.avail_out <= 0) { throw new Error("bug2");}

      if (flush !== Z_FINISH) { return Z_OK; }
      if (s.wrap <= 0) { return Z_STREAM_END; }

      /* Write the trailer */
      if (s.wrap === 2) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        put_byte(s, (strm.adler >> 16) & 0xff);
        put_byte(s, (strm.adler >> 24) & 0xff);
        put_byte(s, strm.total_in & 0xff);
        put_byte(s, (strm.total_in >> 8) & 0xff);
        put_byte(s, (strm.total_in >> 16) & 0xff);
        put_byte(s, (strm.total_in >> 24) & 0xff);
      }
      else
      {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }

      flush_pending(strm);
      /* If avail_out is zero, the application will call deflate again
       * to flush the rest.
       */
      if (s.wrap > 0) { s.wrap = -s.wrap; }
      /* write the trailer only once! */
      return s.pending !== 0 ? Z_OK : Z_STREAM_END;
    };


    const deflateEnd = (strm) => {

      if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
        return Z_STREAM_ERROR;
      }

      const status = strm.state.status;
      if (status !== INIT_STATE &&
        status !== EXTRA_STATE &&
        status !== NAME_STATE &&
        status !== COMMENT_STATE &&
        status !== HCRC_STATE &&
        status !== BUSY_STATE &&
        status !== FINISH_STATE
      ) {
        return err(strm, Z_STREAM_ERROR);
      }

      strm.state = null;

      return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
    };


    /* =========================================================================
     * Initializes the compression dictionary from the given byte
     * sequence without producing any compressed output.
     */
    const deflateSetDictionary = (strm, dictionary) => {

      let dictLength = dictionary.length;

      if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
        return Z_STREAM_ERROR;
      }

      const s = strm.state;
      const wrap = s.wrap;

      if (wrap === 2 || (wrap === 1 && s.status !== INIT_STATE) || s.lookahead) {
        return Z_STREAM_ERROR;
      }

      /* when using zlib wrappers, compute Adler-32 for provided dictionary */
      if (wrap === 1) {
        /* adler32(strm->adler, dictionary, dictLength); */
        strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
      }

      s.wrap = 0;   /* avoid computing Adler-32 in read_buf */

      /* if dictionary would fill window, just replace the history */
      if (dictLength >= s.w_size) {
        if (wrap === 0) {            /* already empty otherwise */
          /*** CLEAR_HASH(s); ***/
          zero(s.head); // Fill with NIL (= 0);
          s.strstart = 0;
          s.block_start = 0;
          s.insert = 0;
        }
        /* use the tail */
        // dictionary = dictionary.slice(dictLength - s.w_size);
        let tmpDict = new Uint8Array(s.w_size);
        tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
        dictionary = tmpDict;
        dictLength = s.w_size;
      }
      /* insert dictionary into window and hash */
      const avail = strm.avail_in;
      const next = strm.next_in;
      const input = strm.input;
      strm.avail_in = dictLength;
      strm.next_in = 0;
      strm.input = dictionary;
      fill_window(s);
      while (s.lookahead >= MIN_MATCH) {
        let str = s.strstart;
        let n = s.lookahead - (MIN_MATCH - 1);
        do {
          /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
          s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);

          s.prev[str & s.w_mask] = s.head[s.ins_h];

          s.head[s.ins_h] = str;
          str++;
        } while (--n);
        s.strstart = str;
        s.lookahead = MIN_MATCH - 1;
        fill_window(s);
      }
      s.strstart += s.lookahead;
      s.block_start = s.strstart;
      s.insert = s.lookahead;
      s.lookahead = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      strm.next_in = next;
      strm.input = input;
      strm.avail_in = avail;
      s.wrap = wrap;
      return Z_OK;
    };


    return compression.deflates =  {
      deflateInit,
      deflateInit2,
      deflateReset,
      deflateResetKeep,
      deflateSetHeader,
      deflate,
      deflateEnd,
      deflateSetDictionary,
      deflateInfo : 'skylarkjs deflate (from Nodeca project)'
    };

});
define('skylark-langx-compression/zstream',[
    "./compression"
], function (compression) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin

    function ZStream() {
      /* next input byte */
      this.input = null; // JS specific, because we have no pointers
      this.next_in = 0;
      /* number of bytes available at input */
      this.avail_in = 0;
      /* total number of input bytes read so far */
      this.total_in = 0;
      /* next output byte should be put there */
      this.output = null; // JS specific, because we have no pointers
      this.next_out = 0;
      /* remaining free space at output */
      this.avail_out = 0;
      /* total number of bytes output so far */
      this.total_out = 0;
      /* last error message, NULL if no error */
      this.msg = ''/*Z_NULL*/;
      /* not visible by applications */
      this.state = null;
      /* best guess about the data type: binary or text */
      this.data_type = 2/*Z_UNKNOWN*/;
      /* adler32 value of the uncompressed data */
      this.adler = 0;
    }

    return compression.ZStream = ZStream;

});
define('skylark-pako/utils/common',[], function () {


    const _has = (obj, key) => {
        return Object.prototype.hasOwnProperty.call(obj, key);
    };

    function assign(obj) {
        const sources = Array.prototype.slice.call(arguments, 1);
        while (sources.length) {
            const source = sources.shift();
            if (!source) {
                continue;
            }
            if (typeof source !== 'object') {
                throw new TypeError(source + 'must be non-object');
            }
            for (const p in source) {
                if (_has(source, p)) {
                    obj[p] = source[p];
                }
            }
        }
        return obj;
    }

    function flattenChunks(chunks){
        let len = 0;
        for (let i = 0, l = chunks.length; i < l; i++) {
            len += chunks[i].length;
        }
        const result = new Uint8Array(len);
        for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
            let chunk = chunks[i];
            result.set(chunk, pos);
            pos += chunk.length;
        }
        return result;
    };

    return {
      assign,
      flattenChunks
    };
});
define('skylark-pako/utils/strings',[], function () {
    'use strict';

    // Quick check if we can use fast array to bin string conversion
    //
    // - apply(Array) can fail on Android 2.2
    // - apply(Uint8Array) can fail on iOS 5.1 Safari
    //
    let STR_APPLY_UIA_OK = true;

    try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch (__) { STR_APPLY_UIA_OK = false; }


    // Table with utf8 lengths (calculated by first byte of sequence)
    // Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
    // because max possible codepoint is 0x10ffff
    const _utf8len = new Uint8Array(256);
    for (let q = 0; q < 256; q++) {
      _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
    }
    _utf8len[254] = _utf8len[254] = 1; // Invalid sequence start


    // convert string to array (typed, when possible)
    const string2buf = (str) => {
      if (typeof TextEncoder === 'function' && TextEncoder.prototype.encode) {
        return new TextEncoder().encode(str);
      }

      let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

      // count binary size
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 0xfc00) === 0xdc00) {
            c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
            m_pos++;
          }
        }
        buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
      }

      // allocate buffer
      buf = new Uint8Array(buf_len);

      // convert
      for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 0xfc00) === 0xdc00) {
            c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
            m_pos++;
          }
        }
        if (c < 0x80) {
          /* one byte */
          buf[i++] = c;
        } else if (c < 0x800) {
          /* two bytes */
          buf[i++] = 0xC0 | (c >>> 6);
          buf[i++] = 0x80 | (c & 0x3f);
        } else if (c < 0x10000) {
          /* three bytes */
          buf[i++] = 0xE0 | (c >>> 12);
          buf[i++] = 0x80 | (c >>> 6 & 0x3f);
          buf[i++] = 0x80 | (c & 0x3f);
        } else {
          /* four bytes */
          buf[i++] = 0xf0 | (c >>> 18);
          buf[i++] = 0x80 | (c >>> 12 & 0x3f);
          buf[i++] = 0x80 | (c >>> 6 & 0x3f);
          buf[i++] = 0x80 | (c & 0x3f);
        }
      }

      return buf;
    };

    // Helper
    const buf2binstring = (buf, len) => {
      // On Chrome, the arguments in a function call that are allowed is `65534`.
      // If the length of the buffer is smaller than that, we can use this optimization,
      // otherwise we will take a slower path.
      if (len < 65534) {
        if (buf.subarray && STR_APPLY_UIA_OK) {
          return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
        }
      }

      let result = '';
      for (let i = 0; i < len; i++) {
        result += String.fromCharCode(buf[i]);
      }
      return result;
    };


    // convert array to string
    const buf2string = (buf, max) => {
      const len = max || buf.length;

      if (typeof TextDecoder === 'function' && TextDecoder.prototype.decode) {
        return new TextDecoder().decode(buf.subarray(0, max));
      }

      let i, out;

      // Reserve max possible length (2 words per char)
      // NB: by unknown reasons, Array is significantly faster for
      //     String.fromCharCode.apply than Uint16Array.
      const utf16buf = new Array(len * 2);

      for (out = 0, i = 0; i < len;) {
        let c = buf[i++];
        // quick process ascii
        if (c < 0x80) { utf16buf[out++] = c; continue; }

        let c_len = _utf8len[c];
        // skip 5 & 6 byte codes
        if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len - 1; continue; }

        // apply mask on first byte
        c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
        // join the rest
        while (c_len > 1 && i < len) {
          c = (c << 6) | (buf[i++] & 0x3f);
          c_len--;
        }

        // terminated by end of string?
        if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

        if (c < 0x10000) {
          utf16buf[out++] = c;
        } else {
          c -= 0x10000;
          utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
          utf16buf[out++] = 0xdc00 | (c & 0x3ff);
        }
      }

      return buf2binstring(utf16buf, out);
    };


    // Calculate max possible position in utf8 buffer,
    // that will not break sequence. If that's not possible
    // - (very small limits) return max size as is.
    //
    // buf[] - utf8 bytes array
    // max   - length limit (mandatory);
    const utf8border = (buf, max) => {

      max = max || buf.length;
      if (max > buf.length) { max = buf.length; }

      // go back from last position, until start of sequence found
      let pos = max - 1;
      while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

      // Very small and broken sequence,
      // return max, because we should return something anyway.
      if (pos < 0) { return max; }

      // If we came to start of buffer - that means buffer is too small,
      // return max too.
      if (pos === 0) { return max; }

      return (pos + _utf8len[buf[pos]] > max) ? pos : max;
    };


    return {
      string2buf,
      buf2string,
      utf8border
    };
});
define('skylark-pako/deflates',[
    'skylark-langx-compression/deflates',
    'skylark-langx-compression/messages',
    'skylark-langx-compression/zstream',
    'skylark-langx-compression/constants',
    './utils/common',
    './utils/strings'

], function (zlib_deflate, msg, ZStream, constants,utils, strings) {
    'use strict';

    const toString = Object.prototype.toString;
    const {Z_NO_FLUSH, Z_SYNC_FLUSH, Z_FULL_FLUSH, Z_FINISH, Z_OK, Z_STREAM_END, Z_DEFAULT_COMPRESSION, Z_DEFAULT_STRATEGY, Z_DEFLATED} = constants;

    /* ===========================================================================*/


    /**
     * class Deflate
     *
     * Generic JS-style wrapper for zlib calls. If you don't need
     * streaming behaviour - use more simple functions: [[deflate]],
     * [[deflateRaw]] and [[gzip]].
     **/

    /* internal
     * Deflate.chunks -> Array
     *
     * Chunks of output data, if [[Deflate#onData]] not overridden.
     **/

    /**
     * Deflate.result -> Uint8Array
     *
     * Compressed result, generated by default [[Deflate#onData]]
     * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
     * (call [[Deflate#push]] with `Z_FINISH` / `true` param).
     **/

    /**
     * Deflate.err -> Number
     *
     * Error code after deflate finished. 0 (Z_OK) on success.
     * You will not need it in real life, because deflate errors
     * are possible only on wrong options or bad `onData` / `onEnd`
     * custom handlers.
     **/

    /**
     * Deflate.msg -> String
     *
     * Error message, if [[Deflate.err]] != 0
     **/


    /**
     * new Deflate(options)
     * - options (Object): zlib deflate options.
     *
     * Creates new deflator instance with specified params. Throws exception
     * on bad params. Supported options:
     *
     * - `level`
     * - `windowBits`
     * - `memLevel`
     * - `strategy`
     * - `dictionary`
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Additional options, for internal needs:
     *
     * - `chunkSize` - size of generated data chunks (16K by default)
     * - `raw` (Boolean) - do raw deflate
     * - `gzip` (Boolean) - create gzip wrapper
     * - `header` (Object) - custom header for gzip
     *   - `text` (Boolean) - true if compressed data believed to be text
     *   - `time` (Number) - modification time, unix timestamp
     *   - `os` (Number) - operation system code
     *   - `extra` (Array) - array of bytes with extra data (max 65536)
     *   - `name` (String) - file name (binary string)
     *   - `comment` (String) - comment (binary string)
     *   - `hcrc` (Boolean) - true if header crc should be added
     *
     * ##### Example:
     *
     * ```javascript
     * const pako = require('pako')
     *   , chunk1 = new Uint8Array([1,2,3,4,5,6,7,8,9])
     *   , chunk2 = new Uint8Array([10,11,12,13,14,15,16,17,18,19]);
     *
     * const deflate = new pako.Deflate({ level: 3});
     *
     * deflate.push(chunk1, false);
     * deflate.push(chunk2, true);  // true -> last chunk
     *
     * if (deflate.err) { throw new Error(deflate.err); }
     *
     * console.log(deflate.result);
     * ```
     **/
    function Deflate(options) {
      this.options = utils.assign({
        level: Z_DEFAULT_COMPRESSION,
        method: Z_DEFLATED,
        chunkSize: 16384,
        windowBits: 15,
        memLevel: 8,
        strategy: Z_DEFAULT_STRATEGY
      }, options || {});

      let opt = this.options;

      if (opt.raw && (opt.windowBits > 0)) {
        opt.windowBits = -opt.windowBits;
      }

      else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
        opt.windowBits += 16;
      }

      this.err    = 0;      // error code, if happens (0 = Z_OK)
      this.msg    = '';     // error message
      this.ended  = false;  // used to avoid multiple onEnd() calls
      this.chunks = [];     // chunks of compressed data

      this.strm = new ZStream();
      this.strm.avail_out = 0;

      let status = zlib_deflate.deflateInit2(
        this.strm,
        opt.level,
        opt.method,
        opt.windowBits,
        opt.memLevel,
        opt.strategy
      );

      if (status !== Z_OK) {
        throw new Error(msg[status]);
      }

      if (opt.header) {
        zlib_deflate.deflateSetHeader(this.strm, opt.header);
      }

      if (opt.dictionary) {
        let dict;
        // Convert data if needed
        if (typeof opt.dictionary === 'string') {
          // If we need to compress text, change encoding to utf8.
          dict = strings.string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === '[object ArrayBuffer]') {
          dict = new Uint8Array(opt.dictionary);
        } else {
          dict = opt.dictionary;
        }

        status = zlib_deflate.deflateSetDictionary(this.strm, dict);

        if (status !== Z_OK) {
          throw new Error(msg[status]);
        }

        this._dict_set = true;
      }
    }

    /**
     * Deflate#push(data[, flush_mode]) -> Boolean
     * - data (Uint8Array|ArrayBuffer|String): input data. Strings will be
     *   converted to utf8 byte sequence.
     * - flush_mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
     *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
     *
     * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
     * new compressed chunks. Returns `true` on success. The last data block must
     * have `flush_mode` Z_FINISH (or `true`). That will flush internal pending
     * buffers and call [[Deflate#onEnd]].
     *
     * On fail call [[Deflate#onEnd]] with error code and return false.
     *
     * ##### Example
     *
     * ```javascript
     * push(chunk, false); // push one of data chunks
     * ...
     * push(chunk, true);  // push last chunk
     * ```
     **/
    Deflate.prototype.push = function (data, flush_mode) {
      const strm = this.strm;
      const chunkSize = this.options.chunkSize;
      let status, _flush_mode;

      if (this.ended) { return false; }

      if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
      else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;

      // Convert data if needed
      if (typeof data === 'string') {
        // If we need to compress text, change encoding to utf8.
        strm.input = strings.string2buf(data);
      } else if (toString.call(data) === '[object ArrayBuffer]') {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }

      strm.next_in = 0;
      strm.avail_in = strm.input.length;

      for (;;) {
        if (strm.avail_out === 0) {
          strm.output = new Uint8Array(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }

        // Make sure avail_out > 6 to avoid repeating markers
        if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
          this.onData(strm.output.subarray(0, strm.next_out));
          strm.avail_out = 0;
          continue;
        }

        status = zlib_deflate.deflate(strm, _flush_mode);

        // Ended => flush and finish
        if (status === Z_STREAM_END) {
          if (strm.next_out > 0) {
            this.onData(strm.output.subarray(0, strm.next_out));
          }
          status = zlib_deflate.deflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return status === Z_OK;
        }

        // Flush if out buffer full
        if (strm.avail_out === 0) {
          this.onData(strm.output);
          continue;
        }

        // Flush if requested and has data
        if (_flush_mode > 0 && strm.next_out > 0) {
          this.onData(strm.output.subarray(0, strm.next_out));
          strm.avail_out = 0;
          continue;
        }

        if (strm.avail_in === 0) break;
      }

      return true;
    };


    /**
     * Deflate#onData(chunk) -> Void
     * - chunk (Uint8Array): output data.
     *
     * By default, stores data blocks in `chunks[]` property and glue
     * those in `onEnd`. Override this handler, if you need another behaviour.
     **/
    Deflate.prototype.onData = function (chunk) {
      this.chunks.push(chunk);
    };


    /**
     * Deflate#onEnd(status) -> Void
     * - status (Number): deflate status. 0 (Z_OK) on success,
     *   other if not.
     *
     * Called once after you tell deflate that the input stream is
     * complete (Z_FINISH). By default - join collected chunks,
     * free memory and fill `results` / `err` properties.
     **/
    Deflate.prototype.onEnd = function (status) {
      // On success - join
      if (status === Z_OK) {
        this.result = utils.flattenChunks(this.chunks);
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };


    /**
     * deflate(data[, options]) -> Uint8Array
     * - data (Uint8Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * Compress `data` with deflate algorithm and `options`.
     *
     * Supported options are:
     *
     * - level
     * - windowBits
     * - memLevel
     * - strategy
     * - dictionary
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Sugar (options):
     *
     * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
     *   negative windowBits implicitly.
     *
     * ##### Example:
     *
     * ```javascript
     * const pako = require('pako')
     * const data = new Uint8Array([1,2,3,4,5,6,7,8,9]);
     *
     * console.log(pako.deflate(data));
     * ```
     **/
    function deflate(input, options) {
      const deflator = new Deflate(options);

      deflator.push(input, true);

      // That will never happens, if you don't cheat with options :)
      if (deflator.err) { throw deflator.msg || msg[deflator.err]; }

      return deflator.result;
    }


    /**
     * deflateRaw(data[, options]) -> Uint8Array
     * - data (Uint8Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * The same as [[deflate]], but creates raw data, without wrapper
     * (header and adler32 crc).
     **/
    function deflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return deflate(input, options);
    }


    /**
     * gzip(data[, options]) -> Uint8Array
     * - data (Uint8Array|String): input data to compress.
     * - options (Object): zlib deflate options.
     *
     * The same as [[deflate]], but create gzip wrapper instead of
     * deflate one.
     **/
    function gzip(input, options) {
      options = options || {};
      options.gzip = true;
      return deflate(input, options);
    }

    return {
        Deflate,
        deflate,
        deflateRaw,
        gzip,
        constants
    };

});
define('skylark-langx-compression/inffast',[
    "./compression"
], function (compression) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin

    // See state defs from inflate.js
    const BAD = 30;       /* got a data error -- remain here until reset */
    const TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

    /*
       Decode literal, length, and distance codes and write out the resulting
       literal and match bytes until either not enough input or output is
       available, an end-of-block is encountered, or a data error is encountered.
       When large enough input and output buffers are supplied to inflate(), for
       example, a 16K input buffer and a 64K output buffer, more than 95% of the
       inflate execution time is spent in this routine.

       Entry assumptions:

            state.mode === LEN
            strm.avail_in >= 6
            strm.avail_out >= 258
            start >= strm.avail_out
            state.bits < 8

       On return, state.mode is one of:

            LEN -- ran out of enough output space or enough available input
            TYPE -- reached end of block code, inflate() to interpret next block
            BAD -- error in block data

       Notes:

        - The maximum input bits used by a length/distance pair is 15 bits for the
          length code, 5 bits for the length extra, 15 bits for the distance code,
          and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
          Therefore if strm.avail_in >= 6, then there is enough input to avoid
          checking for available input while decoding.

        - The maximum bytes that a single length/distance pair can output is 258
          bytes, which is the maximum length that can be coded.  inflate_fast()
          requires strm.avail_out >= 258 for each loop to avoid checking for
          output space.
     */
    function inflate_fast(strm, start) {
      let _in;                    /* local strm.input */
      let last;                   /* have enough input while in < last */
      let _out;                   /* local strm.output */
      let beg;                    /* inflate()'s initial strm.output */
      let end;                    /* while out < end, enough space available */
    //#ifdef INFLATE_STRICT
      let dmax;                   /* maximum distance from zlib header */
    //#endif
      let wsize;                  /* window size or zero if not using window */
      let whave;                  /* valid bytes in the window */
      let wnext;                  /* window write index */
      // Use `s_window` instead `window`, avoid conflict with instrumentation tools
      let s_window;               /* allocated sliding window, if wsize != 0 */
      let hold;                   /* local strm.hold */
      let bits;                   /* local strm.bits */
      let lcode;                  /* local strm.lencode */
      let dcode;                  /* local strm.distcode */
      let lmask;                  /* mask for first level of length codes */
      let dmask;                  /* mask for first level of distance codes */
      let here;                   /* retrieved table entry */
      let op;                     /* code bits, operation, extra bits, or */
                                  /*  window position, window bytes to copy */
      let len;                    /* match length, unused bytes */
      let dist;                   /* match distance */
      let from;                   /* where to copy match from */
      let from_source;


      let input, output; // JS specific, because we have no pointers

      /* copy state to local variables */
      const state = strm.state;
      //here = state.here;
      _in = strm.next_in;
      input = strm.input;
      last = _in + (strm.avail_in - 5);
      _out = strm.next_out;
      output = strm.output;
      beg = _out - (start - strm.avail_out);
      end = _out + (strm.avail_out - 257);
    //#ifdef INFLATE_STRICT
      dmax = state.dmax;
    //#endif
      wsize = state.wsize;
      whave = state.whave;
      wnext = state.wnext;
      s_window = state.window;
      hold = state.hold;
      bits = state.bits;
      lcode = state.lencode;
      dcode = state.distcode;
      lmask = (1 << state.lenbits) - 1;
      dmask = (1 << state.distbits) - 1;


      /* decode literals and length/distances until end-of-block or not enough
         input data or output space */

      top:
      do {
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }

        here = lcode[hold & lmask];

        dolen:
        for (;;) { // Goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;
          if (op === 0) {                          /* literal */
            //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
            //        "inflate:         literal '%c'\n" :
            //        "inflate:         literal 0x%02x\n", here.val));
            output[_out++] = here & 0xffff/*here.val*/;
          }
          else if (op & 16) {                     /* length base */
            len = here & 0xffff/*here.val*/;
            op &= 15;                           /* number of extra bits */
            if (op) {
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
              len += hold & ((1 << op) - 1);
              hold >>>= op;
              bits -= op;
            }
            //Tracevv((stderr, "inflate:         length %u\n", len));
            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }
            here = dcode[hold & dmask];

            dodist:
            for (;;) { // goto emulation
              op = here >>> 24/*here.bits*/;
              hold >>>= op;
              bits -= op;
              op = (here >>> 16) & 0xff/*here.op*/;

              if (op & 16) {                      /* distance base */
                dist = here & 0xffff/*here.val*/;
                op &= 15;                       /* number of extra bits */
                if (bits < op) {
                  hold += input[_in++] << bits;
                  bits += 8;
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                }
                dist += hold & ((1 << op) - 1);
    //#ifdef INFLATE_STRICT
                if (dist > dmax) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break top;
                }
    //#endif
                hold >>>= op;
                bits -= op;
                //Tracevv((stderr, "inflate:         distance %u\n", dist));
                op = _out - beg;                /* max distance in output */
                if (dist > op) {                /* see if copy from window */
                  op = dist - op;               /* distance back in window */
                  if (op > whave) {
                    if (state.sane) {
                      strm.msg = 'invalid distance too far back';
                      state.mode = BAD;
                      break top;
                    }

    // (!) This block is disabled in zlib defaults,
    // don't enable it for binary compatibility
    //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
    //                if (len <= op - whave) {
    //                  do {
    //                    output[_out++] = 0;
    //                  } while (--len);
    //                  continue top;
    //                }
    //                len -= op - whave;
    //                do {
    //                  output[_out++] = 0;
    //                } while (--op > whave);
    //                if (op === 0) {
    //                  from = _out - dist;
    //                  do {
    //                    output[_out++] = output[from++];
    //                  } while (--len);
    //                  continue top;
    //                }
    //#endif
                  }
                  from = 0; // window index
                  from_source = s_window;
                  if (wnext === 0) {           /* very common case */
                    from += wsize - op;
                    if (op < len) {         /* some from window */
                      len -= op;
                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);
                      from = _out - dist;  /* rest from output */
                      from_source = output;
                    }
                  }
                  else if (wnext < op) {      /* wrap around window */
                    from += wsize + wnext - op;
                    op -= wnext;
                    if (op < len) {         /* some from end of window */
                      len -= op;
                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);
                      from = 0;
                      if (wnext < len) {  /* some from start of window */
                        op = wnext;
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = _out - dist;      /* rest from output */
                        from_source = output;
                      }
                    }
                  }
                  else {                      /* contiguous in window */
                    from += wnext - op;
                    if (op < len) {         /* some from window */
                      len -= op;
                      do {
                        output[_out++] = s_window[from++];
                      } while (--op);
                      from = _out - dist;  /* rest from output */
                      from_source = output;
                    }
                  }
                  while (len > 2) {
                    output[_out++] = from_source[from++];
                    output[_out++] = from_source[from++];
                    output[_out++] = from_source[from++];
                    len -= 3;
                  }
                  if (len) {
                    output[_out++] = from_source[from++];
                    if (len > 1) {
                      output[_out++] = from_source[from++];
                    }
                  }
                }
                else {
                  from = _out - dist;          /* copy direct from output */
                  do {                        /* minimum length is three */
                    output[_out++] = output[from++];
                    output[_out++] = output[from++];
                    output[_out++] = output[from++];
                    len -= 3;
                  } while (len > 2);
                  if (len) {
                    output[_out++] = output[from++];
                    if (len > 1) {
                      output[_out++] = output[from++];
                    }
                  }
                }
              }
              else if ((op & 64) === 0) {          /* 2nd level distance code */
                here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
                continue dodist;
              }
              else {
                strm.msg = 'invalid distance code';
                state.mode = BAD;
                break top;
              }

              break; // need to emulate goto via "continue"
            }
          }
          else if ((op & 64) === 0) {              /* 2nd level length code */
            here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dolen;
          }
          else if (op & 32) {                     /* end-of-block */
            //Tracevv((stderr, "inflate:         end of block\n"));
            state.mode = TYPE;
            break top;
          }
          else {
            strm.msg = 'invalid literal/length code';
            state.mode = BAD;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      } while (_in < last && _out < end);

      /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
      len = bits >> 3;
      _in -= len;
      bits -= len << 3;
      hold &= (1 << bits) - 1;

      /* update state and return */
      strm.next_in = _in;
      strm.next_out = _out;
      strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
      strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
      state.hold = hold;
      state.bits = bits;
      return;
    };


    return compression.inffast =  inflate_fast;
});
define('skylark-langx-compression/inftrees',[
    "./compression"
], function (compression) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin

    const MAXBITS = 15;
    const ENOUGH_LENS = 852;
    const ENOUGH_DISTS = 592;
    //const ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

    const CODES = 0;
    const LENS = 1;
    const DISTS = 2;

    const lbase = new Uint16Array([ /* Length codes 257..285 base */
      3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
      35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
    ]);

    const lext = new Uint8Array([ /* Length codes 257..285 extra */
      16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
      19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
    ]);

    const dbase = new Uint16Array([ /* Distance codes 0..29 base */
      1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
      257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
      8193, 12289, 16385, 24577, 0, 0
    ]);

    const dext = new Uint8Array([ /* Distance codes 0..29 extra */
      16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
      23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
      28, 28, 29, 29, 64, 64
    ]);

    const inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) =>
    {
      const bits = opts.bits;
          //here = opts.here; /* table entry for duplication */

      let len = 0;               /* a code's length in bits */
      let sym = 0;               /* index of code symbols */
      let min = 0, max = 0;          /* minimum and maximum code lengths */
      let root = 0;              /* number of index bits for root table */
      let curr = 0;              /* number of index bits for current table */
      let drop = 0;              /* code bits to drop for sub-table */
      let left = 0;                   /* number of prefix codes available */
      let used = 0;              /* code entries in table used */
      let huff = 0;              /* Huffman code */
      let incr;              /* for incrementing code, index */
      let fill;              /* index for replicating entries */
      let low;               /* low bits for current root entry */
      let mask;              /* mask for low root bits */
      let next;             /* next available space in table */
      let base = null;     /* base value table to use */
      let base_index = 0;
    //  let shoextra;    /* extra bits table to use */
      let end;                    /* use base and extra for symbol > end */
      const count = new Uint16Array(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */
      const offs = new Uint16Array(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */
      let extra = null;
      let extra_index = 0;

      let here_bits, here_op, here_val;

      /*
       Process a set of code lengths to create a canonical Huffman code.  The
       code lengths are lens[0..codes-1].  Each length corresponds to the
       symbols 0..codes-1.  The Huffman code is generated by first sorting the
       symbols by length from short to long, and retaining the symbol order
       for codes with equal lengths.  Then the code starts with all zero bits
       for the first code of the shortest length, and the codes are integer
       increments for the same length, and zeros are appended as the length
       increases.  For the deflate format, these bits are stored backwards
       from their more natural integer increment ordering, and so when the
       decoding tables are built in the large loop below, the integer codes
       are incremented backwards.

       This routine assumes, but does not check, that all of the entries in
       lens[] are in the range 0..MAXBITS.  The caller must assure this.
       1..MAXBITS is interpreted as that code length.  zero means that that
       symbol does not occur in this code.

       The codes are sorted by computing a count of codes for each length,
       creating from that a table of starting indices for each length in the
       sorted table, and then entering the symbols in order in the sorted
       table.  The sorted table is work[], with that space being provided by
       the caller.

       The length counts are used for other purposes as well, i.e. finding
       the minimum and maximum length codes, determining if there are any
       codes at all, checking for a valid set of lengths, and looking ahead
       at length counts to determine sub-table sizes when building the
       decoding tables.
       */

      /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
      for (len = 0; len <= MAXBITS; len++) {
        count[len] = 0;
      }
      for (sym = 0; sym < codes; sym++) {
        count[lens[lens_index + sym]]++;
      }

      /* bound code lengths, force root to be within code lengths */
      root = bits;
      for (max = MAXBITS; max >= 1; max--) {
        if (count[max] !== 0) { break; }
      }
      if (root > max) {
        root = max;
      }
      if (max === 0) {                     /* no symbols to code at all */
        //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
        //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
        //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
        table[table_index++] = (1 << 24) | (64 << 16) | 0;


        //table.op[opts.table_index] = 64;
        //table.bits[opts.table_index] = 1;
        //table.val[opts.table_index++] = 0;
        table[table_index++] = (1 << 24) | (64 << 16) | 0;

        opts.bits = 1;
        return 0;     /* no symbols, but wait for decoding to report error */
      }
      for (min = 1; min < max; min++) {
        if (count[min] !== 0) { break; }
      }
      if (root < min) {
        root = min;
      }

      /* check for an over-subscribed or incomplete set of lengths */
      left = 1;
      for (len = 1; len <= MAXBITS; len++) {
        left <<= 1;
        left -= count[len];
        if (left < 0) {
          return -1;
        }        /* over-subscribed */
      }
      if (left > 0 && (type === CODES || max !== 1)) {
        return -1;                      /* incomplete set */
      }

      /* generate offsets into symbol table for each length for sorting */
      offs[1] = 0;
      for (len = 1; len < MAXBITS; len++) {
        offs[len + 1] = offs[len] + count[len];
      }

      /* sort symbols by length, by symbol order within each length */
      for (sym = 0; sym < codes; sym++) {
        if (lens[lens_index + sym] !== 0) {
          work[offs[lens[lens_index + sym]]++] = sym;
        }
      }

      /*
       Create and fill in decoding tables.  In this loop, the table being
       filled is at next and has curr index bits.  The code being used is huff
       with length len.  That code is converted to an index by dropping drop
       bits off of the bottom.  For codes where len is less than drop + curr,
       those top drop + curr - len bits are incremented through all values to
       fill the table with replicated entries.

       root is the number of index bits for the root table.  When len exceeds
       root, sub-tables are created pointed to by the root entry with an index
       of the low root bits of huff.  This is saved in low to check for when a
       new sub-table should be started.  drop is zero when the root table is
       being filled, and drop is root when sub-tables are being filled.

       When a new sub-table is needed, it is necessary to look ahead in the
       code lengths to determine what size sub-table is needed.  The length
       counts are used for this, and so count[] is decremented as codes are
       entered in the tables.

       used keeps track of how many table entries have been allocated from the
       provided *table space.  It is checked for LENS and DIST tables against
       the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
       the initial root table size constants.  See the comments in inftrees.h
       for more information.

       sym increments through all symbols, and the loop terminates when
       all codes of length max, i.e. all codes, have been processed.  This
       routine permits incomplete codes, so another loop after this one fills
       in the rest of the decoding tables with invalid code markers.
       */

      /* set up for code type */
      // poor man optimization - use if-else instead of switch,
      // to avoid deopts in old v8
      if (type === CODES) {
        base = extra = work;    /* dummy value--not used */
        end = 19;

      } else if (type === LENS) {
        base = lbase;
        base_index -= 257;
        extra = lext;
        extra_index -= 257;
        end = 256;

      } else {                    /* DISTS */
        base = dbase;
        extra = dext;
        end = -1;
      }

      /* initialize opts for loop */
      huff = 0;                   /* starting code */
      sym = 0;                    /* starting code symbol */
      len = min;                  /* starting code length */
      next = table_index;              /* current table to fill in */
      curr = root;                /* current table index bits */
      drop = 0;                   /* current bits to drop from code for index */
      low = -1;                   /* trigger new sub-table when len > root */
      used = 1 << root;          /* use root table entries */
      mask = used - 1;            /* mask for comparing low */

      /* check available table space */
      if ((type === LENS && used > ENOUGH_LENS) ||
        (type === DISTS && used > ENOUGH_DISTS)) {
        return 1;
      }

      /* process all codes and make table entries */
      for (;;) {
        /* create table entry */
        here_bits = len - drop;
        if (work[sym] < end) {
          here_op = 0;
          here_val = work[sym];
        }
        else if (work[sym] > end) {
          here_op = extra[extra_index + work[sym]];
          here_val = base[base_index + work[sym]];
        }
        else {
          here_op = 32 + 64;         /* end of block */
          here_val = 0;
        }

        /* replicate for those indices with low len bits equal to huff */
        incr = 1 << (len - drop);
        fill = 1 << curr;
        min = fill;                 /* save offset to next table */
        do {
          fill -= incr;
          table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
        } while (fill !== 0);

        /* backwards increment the len-bit code huff */
        incr = 1 << (len - 1);
        while (huff & incr) {
          incr >>= 1;
        }
        if (incr !== 0) {
          huff &= incr - 1;
          huff += incr;
        } else {
          huff = 0;
        }

        /* go to next symbol, update count, len */
        sym++;
        if (--count[len] === 0) {
          if (len === max) { break; }
          len = lens[lens_index + work[sym]];
        }

        /* create new sub-table if needed */
        if (len > root && (huff & mask) !== low) {
          /* if first time, transition to sub-tables */
          if (drop === 0) {
            drop = root;
          }

          /* increment past last table */
          next += min;            /* here min is 1 << curr */

          /* determine length of next table */
          curr = len - drop;
          left = 1 << curr;
          while (curr + drop < max) {
            left -= count[curr + drop];
            if (left <= 0) { break; }
            curr++;
            left <<= 1;
          }

          /* check for enough space */
          used += 1 << curr;
          if ((type === LENS && used > ENOUGH_LENS) ||
            (type === DISTS && used > ENOUGH_DISTS)) {
            return 1;
          }

          /* point entry in root table to sub-table */
          low = huff & mask;
          /*table.op[low] = curr;
          table.bits[low] = root;
          table.val[low] = next - opts.table_index;*/
          table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
        }
      }

      /* fill in remaining table entry if code is incomplete (guaranteed to have
       at most one remaining entry, since if the code is incomplete, the
       maximum code length that was allowed to get this far is one bit) */
      if (huff !== 0) {
        //table.op[next + huff] = 64;            /* invalid code marker */
        //table.bits[next + huff] = len - drop;
        //table.val[next + huff] = 0;
        table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
      }

      /* set return parameters */
      //opts.table_index += used;
      opts.bits = root;
      return 0;
    };

   return compression.inftrees =  inflate_table;

});
define('skylark-langx-compression/inflates',[
    "./compression",
    './adler32',
    './crc32',
    './inffast',
    './inftrees',
    './constants'
], function (compression, adler32, crc32, inflate_fast, inflate_table, constants) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin

    const CODES = 0;
    const LENS = 1;
    const DISTS = 2;

    /* Public constants ==========================================================*/
    /* ===========================================================================*/
    const {
        Z_FINISH, 
        Z_BLOCK, 
        Z_TREES, 
        Z_OK, 
        Z_STREAM_END, 
        Z_NEED_DICT, 
        Z_STREAM_ERROR, 
        Z_DATA_ERROR, 
        Z_MEM_ERROR, 
        Z_BUF_ERROR, 
        Z_DEFLATED
    } = constants;
    
    /* STATES ====================================================================*/
    /* ===========================================================================*/

    const    HEAD = 1;       /* i: waiting for magic header */
    const    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
    const    TIME = 3;       /* i: waiting for modification time (gzip) */
    const    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
    const    EXLEN = 5;      /* i: waiting for extra length (gzip) */
    const    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
    const    NAME = 7;       /* i: waiting for end of file name (gzip) */
    const    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
    const    HCRC = 9;       /* i: waiting for header crc (gzip) */
    const    DICTID = 10;    /* i: waiting for dictionary check value */
    const    DICT = 11;      /* waiting for inflateSetDictionary() call */
    const        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
    const        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
    const        STORED = 14;    /* i: waiting for stored size (length and complement) */
    const        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
    const        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
    const        TABLE = 17;     /* i: waiting for dynamic block table lengths */
    const        LENLENS = 18;   /* i: waiting for code length code lengths */
    const        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
    const            LEN_ = 20;      /* i: same as LEN below, but only first time in */
    const            LEN = 21;       /* i: waiting for length/lit/eob code */
    const            LENEXT = 22;    /* i: waiting for length extra bits */
    const            DIST = 23;      /* i: waiting for distance code */
    const            DISTEXT = 24;   /* i: waiting for distance extra bits */
    const            MATCH = 25;     /* o: waiting for output space to copy string */
    const            LIT = 26;       /* o: waiting for output space to write literal */
    const    CHECK = 27;     /* i: waiting for 32-bit check value */
    const    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
    const    DONE = 29;      /* finished check, done -- remain here until reset */
    const    BAD = 30;       /* got a data error -- remain here until reset */
    const    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
    const    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

    /* ===========================================================================*/



    const ENOUGH_LENS = 852;
    const ENOUGH_DISTS = 592;
    //const ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

    const MAX_WBITS = 15;
    /* 32K LZ77 window */
    const DEF_WBITS = MAX_WBITS;


    const zswap32 = (q) => {

      return  (((q >>> 24) & 0xff) +
              ((q >>> 8) & 0xff00) +
              ((q & 0xff00) << 8) +
              ((q & 0xff) << 24));
    };


    function InflateState() {
      this.mode = 0;             /* current inflate mode */
      this.last = false;          /* true if processing last block */
      this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
      this.havedict = false;      /* true if dictionary provided */
      this.flags = 0;             /* gzip header method and flags (0 if zlib) */
      this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
      this.check = 0;             /* protected copy of check value */
      this.total = 0;             /* protected copy of output count */
      // TODO: may be {}
      this.head = null;           /* where to save gzip header information */

      /* sliding window */
      this.wbits = 0;             /* log base 2 of requested window size */
      this.wsize = 0;             /* window size or zero if not using window */
      this.whave = 0;             /* valid bytes in the window */
      this.wnext = 0;             /* window write index */
      this.window = null;         /* allocated sliding window, if needed */

      /* bit accumulator */
      this.hold = 0;              /* input bit accumulator */
      this.bits = 0;              /* number of bits in "in" */

      /* for string and stored block copying */
      this.length = 0;            /* literal or length of data to copy */
      this.offset = 0;            /* distance back to copy string from */

      /* for table and code decoding */
      this.extra = 0;             /* extra bits needed */

      /* fixed and dynamic code tables */
      this.lencode = null;          /* starting table for length/literal codes */
      this.distcode = null;         /* starting table for distance codes */
      this.lenbits = 0;           /* index bits for lencode */
      this.distbits = 0;          /* index bits for distcode */

      /* dynamic table building */
      this.ncode = 0;             /* number of code length code lengths */
      this.nlen = 0;              /* number of length code lengths */
      this.ndist = 0;             /* number of distance code lengths */
      this.have = 0;              /* number of code lengths in lens[] */
      this.next = null;              /* next available space in codes[] */

      this.lens = new Uint16Array(320); /* temporary storage for code lengths */
      this.work = new Uint16Array(288); /* work area for code table building */

      /*
       because we don't have pointers in js, we use lencode and distcode directly
       as buffers so we don't need codes
      */
      //this.codes = new Int32Array(ENOUGH);       /* space for code tables */
      this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
      this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
      this.sane = 0;                   /* if false, allow invalid distance too far */
      this.back = 0;                   /* bits back of last unprocessed length/lit */
      this.was = 0;                    /* initial length of match */
    }


    const inflateResetKeep = (strm) => {

      if (!strm || !strm.state) { return Z_STREAM_ERROR; }
      const state = strm.state;
      strm.total_in = strm.total_out = state.total = 0;
      strm.msg = ''; /*Z_NULL*/
      if (state.wrap) {       /* to support ill-conceived Java test suite */
        strm.adler = state.wrap & 1;
      }
      state.mode = HEAD;
      state.last = 0;
      state.havedict = 0;
      state.dmax = 32768;
      state.head = null/*Z_NULL*/;
      state.hold = 0;
      state.bits = 0;
      //state.lencode = state.distcode = state.next = state.codes;
      state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
      state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);

      state.sane = 1;
      state.back = -1;
      //Tracev((stderr, "inflate: reset\n"));
      return Z_OK;
    };


    const inflateReset = (strm) => {

      if (!strm || !strm.state) { return Z_STREAM_ERROR; }
      const state = strm.state;
      state.wsize = 0;
      state.whave = 0;
      state.wnext = 0;
      return inflateResetKeep(strm);

    };


    const inflateReset2 = (strm, windowBits) => {
      let wrap;

      /* get the state */
      if (!strm || !strm.state) { return Z_STREAM_ERROR; }
      const state = strm.state;

      /* extract wrap request from windowBits parameter */
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      }
      else {
        wrap = (windowBits >> 4) + 1;
        if (windowBits < 48) {
          windowBits &= 15;
        }
      }

      /* set number of window bits, free window if different */
      if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR;
      }
      if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
      }

      /* update state and reset the rest of it */
      state.wrap = wrap;
      state.wbits = windowBits;
      return inflateReset(strm);
    };


    const inflateInit2 = (strm, windowBits) => {

      if (!strm) { return Z_STREAM_ERROR; }
      //strm.msg = Z_NULL;                 /* in case we return an error */

      const state = new InflateState();

      //if (state === Z_NULL) return Z_MEM_ERROR;
      //Tracev((stderr, "inflate: allocated\n"));
      strm.state = state;
      state.window = null/*Z_NULL*/;
      const ret = inflateReset2(strm, windowBits);
      if (ret !== Z_OK) {
        strm.state = null/*Z_NULL*/;
      }
      return ret;
    };


    const inflateInit = (strm) => {

      return inflateInit2(strm, DEF_WBITS);
    };


    /*
     Return state with length and distance decoding tables and index sizes set to
     fixed code decoding.  Normally this returns fixed tables from inffixed.h.
     If BUILDFIXED is defined, then instead this routine builds the tables the
     first time it's called, and returns those tables the first time and
     thereafter.  This reduces the size of the code by about 2K bytes, in
     exchange for a little execution time.  However, BUILDFIXED should not be
     used for threaded applications, since the rewriting of the tables and virgin
     may not be thread-safe.
     */
    let virgin = true;

    let lenfix, distfix; // We have no pointers in JS, so keep tables separate


    const fixedtables = (state) => {

      /* build fixed huffman tables if first call (may not be thread safe) */
      if (virgin) {
        lenfix = new Int32Array(512);
        distfix = new Int32Array(32);

        /* literal/length table */
        let sym = 0;
        while (sym < 144) { state.lens[sym++] = 8; }
        while (sym < 256) { state.lens[sym++] = 9; }
        while (sym < 280) { state.lens[sym++] = 7; }
        while (sym < 288) { state.lens[sym++] = 8; }

        inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, { bits: 9 });

        /* distance table */
        sym = 0;
        while (sym < 32) { state.lens[sym++] = 5; }

        inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, { bits: 5 });

        /* do this just once */
        virgin = false;
      }

      state.lencode = lenfix;
      state.lenbits = 9;
      state.distcode = distfix;
      state.distbits = 5;
    };


    /*
     Update the window with the last wsize (normally 32K) bytes written before
     returning.  If window does not exist yet, create it.  This is only called
     when a window is already in use, or when output has been written during this
     inflate call, but the end of the deflate stream has not been reached yet.
     It is also called to create a window for dictionary data when a dictionary
     is loaded.

     Providing output buffers larger than 32K to inflate() should provide a speed
     advantage, since only the last 32K of output is copied to the sliding window
     upon return from inflate(), and since all distances after the first 32K of
     output will fall in the output data, making match copies simpler and faster.
     The advantage may be dependent on the size of the processor's data caches.
     */
    const updatewindow = (strm, src, end, copy) => {

      let dist;
      const state = strm.state;

      /* if it hasn't been done already, allocate space for the window */
      if (state.window === null) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;

        state.window = new Uint8Array(state.wsize);
      }

      /* copy state->wsize or less output bytes into the circular window */
      if (copy >= state.wsize) {
        state.window.set(src.subarray(end - state.wsize, end), 0);
        state.wnext = 0;
        state.whave = state.wsize;
      }
      else {
        dist = state.wsize - state.wnext;
        if (dist > copy) {
          dist = copy;
        }
        //zmemcpy(state->window + state->wnext, end - copy, dist);
        state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
        copy -= dist;
        if (copy) {
          //zmemcpy(state->window, end - copy, copy);
          state.window.set(src.subarray(end - copy, end), 0);
          state.wnext = copy;
          state.whave = state.wsize;
        }
        else {
          state.wnext += dist;
          if (state.wnext === state.wsize) { state.wnext = 0; }
          if (state.whave < state.wsize) { state.whave += dist; }
        }
      }
      return 0;
    };


    const inflate = (strm, flush) => {

      let state;
      let input, output;          // input/output buffers
      let next;                   /* next input INDEX */
      let put;                    /* next output INDEX */
      let have, left;             /* available input and output */
      let hold;                   /* bit buffer */
      let bits;                   /* bits in bit buffer */
      let _in, _out;              /* save starting available input and output */
      let copy;                   /* number of stored or match bytes to copy */
      let from;                   /* where to copy match bytes from */
      let from_source;
      let here = 0;               /* current decoding table entry */
      let here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
      //let last;                   /* parent table entry */
      let last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
      let len;                    /* length to copy for repeats, bits to drop */
      let ret;                    /* return code */
      const hbuf = new Uint8Array(4);    /* buffer for gzip header crc calculation */
      let opts;

      let n; // temporary variable for NEED_BITS

      const order = /* permutation of code lengths */
        new Uint8Array([ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ]);


      if (!strm || !strm.state || !strm.output ||
          (!strm.input && strm.avail_in !== 0)) {
        return Z_STREAM_ERROR;
      }

      state = strm.state;
      if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


      //--- LOAD() ---
      put = strm.next_out;
      output = strm.output;
      left = strm.avail_out;
      next = strm.next_in;
      input = strm.input;
      have = strm.avail_in;
      hold = state.hold;
      bits = state.bits;
      //---

      _in = have;
      _out = left;
      ret = Z_OK;

      inf_leave: // goto emulation
      for (;;) {
        switch (state.mode) {
          case HEAD:
            if (state.wrap === 0) {
              state.mode = TYPEDO;
              break;
            }
            //=== NEEDBITS(16);
            while (bits < 16) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
              state.check = 0/*crc32(0L, Z_NULL, 0)*/;
              //=== CRC2(state.check, hold);
              hbuf[0] = hold & 0xff;
              hbuf[1] = (hold >>> 8) & 0xff;
              state.check = crc32(state.check, hbuf, 2, 0);
              //===//

              //=== INITBITS();
              hold = 0;
              bits = 0;
              //===//
              state.mode = FLAGS;
              break;
            }
            state.flags = 0;           /* expect zlib header */
            if (state.head) {
              state.head.done = false;
            }
            if (!(state.wrap & 1) ||   /* check if zlib header allowed */
              (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
              strm.msg = 'incorrect header check';
              state.mode = BAD;
              break;
            }
            if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
              strm.msg = 'unknown compression method';
              state.mode = BAD;
              break;
            }
            //--- DROPBITS(4) ---//
            hold >>>= 4;
            bits -= 4;
            //---//
            len = (hold & 0x0f)/*BITS(4)*/ + 8;
            if (state.wbits === 0) {
              state.wbits = len;
            }
            else if (len > state.wbits) {
              strm.msg = 'invalid window size';
              state.mode = BAD;
              break;
            }

            // !!! pako patch. Force use `options.windowBits` if passed.
            // Required to always use max window size by default.
            state.dmax = 1 << state.wbits;
            //state.dmax = 1 << len;

            //Tracev((stderr, "inflate:   zlib header ok\n"));
            strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
            state.mode = hold & 0x200 ? DICTID : TYPE;
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            break;
          case FLAGS:
            //=== NEEDBITS(16); */
            while (bits < 16) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            state.flags = hold;
            if ((state.flags & 0xff) !== Z_DEFLATED) {
              strm.msg = 'unknown compression method';
              state.mode = BAD;
              break;
            }
            if (state.flags & 0xe000) {
              strm.msg = 'unknown header flags set';
              state.mode = BAD;
              break;
            }
            if (state.head) {
              state.head.text = ((hold >> 8) & 1);
            }
            if (state.flags & 0x0200) {
              //=== CRC2(state.check, hold);
              hbuf[0] = hold & 0xff;
              hbuf[1] = (hold >>> 8) & 0xff;
              state.check = crc32(state.check, hbuf, 2, 0);
              //===//
            }
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            state.mode = TIME;
            /* falls through */
          case TIME:
            //=== NEEDBITS(32); */
            while (bits < 32) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            if (state.head) {
              state.head.time = hold;
            }
            if (state.flags & 0x0200) {
              //=== CRC4(state.check, hold)
              hbuf[0] = hold & 0xff;
              hbuf[1] = (hold >>> 8) & 0xff;
              hbuf[2] = (hold >>> 16) & 0xff;
              hbuf[3] = (hold >>> 24) & 0xff;
              state.check = crc32(state.check, hbuf, 4, 0);
              //===
            }
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            state.mode = OS;
            /* falls through */
          case OS:
            //=== NEEDBITS(16); */
            while (bits < 16) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            if (state.head) {
              state.head.xflags = (hold & 0xff);
              state.head.os = (hold >> 8);
            }
            if (state.flags & 0x0200) {
              //=== CRC2(state.check, hold);
              hbuf[0] = hold & 0xff;
              hbuf[1] = (hold >>> 8) & 0xff;
              state.check = crc32(state.check, hbuf, 2, 0);
              //===//
            }
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            state.mode = EXLEN;
            /* falls through */
          case EXLEN:
            if (state.flags & 0x0400) {
              //=== NEEDBITS(16); */
              while (bits < 16) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              state.length = hold;
              if (state.head) {
                state.head.extra_len = hold;
              }
              if (state.flags & 0x0200) {
                //=== CRC2(state.check, hold);
                hbuf[0] = hold & 0xff;
                hbuf[1] = (hold >>> 8) & 0xff;
                state.check = crc32(state.check, hbuf, 2, 0);
                //===//
              }
              //=== INITBITS();
              hold = 0;
              bits = 0;
              //===//
            }
            else if (state.head) {
              state.head.extra = null/*Z_NULL*/;
            }
            state.mode = EXTRA;
            /* falls through */
          case EXTRA:
            if (state.flags & 0x0400) {
              copy = state.length;
              if (copy > have) { copy = have; }
              if (copy) {
                if (state.head) {
                  len = state.head.extra_len - state.length;
                  if (!state.head.extra) {
                    // Use untyped array for more convenient processing later
                    state.head.extra = new Uint8Array(state.head.extra_len);
                  }
                  state.head.extra.set(
                    input.subarray(
                      next,
                      // extra field is limited to 65536 bytes
                      // - no need for additional size check
                      next + copy
                    ),
                    /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                    len
                  );
                  //zmemcpy(state.head.extra + len, next,
                  //        len + copy > state.head.extra_max ?
                  //        state.head.extra_max - len : copy);
                }
                if (state.flags & 0x0200) {
                  state.check = crc32(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                state.length -= copy;
              }
              if (state.length) { break inf_leave; }
            }
            state.length = 0;
            state.mode = NAME;
            /* falls through */
          case NAME:
            if (state.flags & 0x0800) {
              if (have === 0) { break inf_leave; }
              copy = 0;
              do {
                // TODO: 2 or 1 bytes?
                len = input[next + copy++];
                /* use constant limit because in js we should not preallocate memory */
                if (state.head && len &&
                    (state.length < 65536 /*state.head.name_max*/)) {
                  state.head.name += String.fromCharCode(len);
                }
              } while (len && copy < have);

              if (state.flags & 0x0200) {
                state.check = crc32(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              if (len) { break inf_leave; }
            }
            else if (state.head) {
              state.head.name = null;
            }
            state.length = 0;
            state.mode = COMMENT;
            /* falls through */
          case COMMENT:
            if (state.flags & 0x1000) {
              if (have === 0) { break inf_leave; }
              copy = 0;
              do {
                len = input[next + copy++];
                /* use constant limit because in js we should not preallocate memory */
                if (state.head && len &&
                    (state.length < 65536 /*state.head.comm_max*/)) {
                  state.head.comment += String.fromCharCode(len);
                }
              } while (len && copy < have);
              if (state.flags & 0x0200) {
                state.check = crc32(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              if (len) { break inf_leave; }
            }
            else if (state.head) {
              state.head.comment = null;
            }
            state.mode = HCRC;
            /* falls through */
          case HCRC:
            if (state.flags & 0x0200) {
              //=== NEEDBITS(16); */
              while (bits < 16) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              if (hold !== (state.check & 0xffff)) {
                strm.msg = 'header crc mismatch';
                state.mode = BAD;
                break;
              }
              //=== INITBITS();
              hold = 0;
              bits = 0;
              //===//
            }
            if (state.head) {
              state.head.hcrc = ((state.flags >> 9) & 1);
              state.head.done = true;
            }
            strm.adler = state.check = 0;
            state.mode = TYPE;
            break;
          case DICTID:
            //=== NEEDBITS(32); */
            while (bits < 32) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            strm.adler = state.check = zswap32(hold);
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            state.mode = DICT;
            /* falls through */
          case DICT:
            if (state.havedict === 0) {
              //--- RESTORE() ---
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              //---
              return Z_NEED_DICT;
            }
            strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
            state.mode = TYPE;
            /* falls through */
          case TYPE:
            if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
            /* falls through */
          case TYPEDO:
            if (state.last) {
              //--- BYTEBITS() ---//
              hold >>>= bits & 7;
              bits -= bits & 7;
              //---//
              state.mode = CHECK;
              break;
            }
            //=== NEEDBITS(3); */
            while (bits < 3) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            state.last = (hold & 0x01)/*BITS(1)*/;
            //--- DROPBITS(1) ---//
            hold >>>= 1;
            bits -= 1;
            //---//

            switch ((hold & 0x03)/*BITS(2)*/) {
              case 0:                             /* stored block */
                //Tracev((stderr, "inflate:     stored block%s\n",
                //        state.last ? " (last)" : ""));
                state.mode = STORED;
                break;
              case 1:                             /* fixed block */
                fixedtables(state);
                //Tracev((stderr, "inflate:     fixed codes block%s\n",
                //        state.last ? " (last)" : ""));
                state.mode = LEN_;             /* decode codes */
                if (flush === Z_TREES) {
                  //--- DROPBITS(2) ---//
                  hold >>>= 2;
                  bits -= 2;
                  //---//
                  break inf_leave;
                }
                break;
              case 2:                             /* dynamic block */
                //Tracev((stderr, "inflate:     dynamic codes block%s\n",
                //        state.last ? " (last)" : ""));
                state.mode = TABLE;
                break;
              case 3:
                strm.msg = 'invalid block type';
                state.mode = BAD;
            }
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
            break;
          case STORED:
            //--- BYTEBITS() ---// /* go to byte boundary */
            hold >>>= bits & 7;
            bits -= bits & 7;
            //---//
            //=== NEEDBITS(32); */
            while (bits < 32) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
              strm.msg = 'invalid stored block lengths';
              state.mode = BAD;
              break;
            }
            state.length = hold & 0xffff;
            //Tracev((stderr, "inflate:       stored length %u\n",
            //        state.length));
            //=== INITBITS();
            hold = 0;
            bits = 0;
            //===//
            state.mode = COPY_;
            if (flush === Z_TREES) { break inf_leave; }
            /* falls through */
          case COPY_:
            state.mode = COPY;
            /* falls through */
          case COPY:
            copy = state.length;
            if (copy) {
              if (copy > have) { copy = have; }
              if (copy > left) { copy = left; }
              if (copy === 0) { break inf_leave; }
              //--- zmemcpy(put, next, copy); ---
              output.set(input.subarray(next, next + copy), put);
              //---//
              have -= copy;
              next += copy;
              left -= copy;
              put += copy;
              state.length -= copy;
              break;
            }
            //Tracev((stderr, "inflate:       stored end\n"));
            state.mode = TYPE;
            break;
          case TABLE:
            //=== NEEDBITS(14); */
            while (bits < 14) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
            //--- DROPBITS(5) ---//
            hold >>>= 5;
            bits -= 5;
            //---//
            state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
            //--- DROPBITS(5) ---//
            hold >>>= 5;
            bits -= 5;
            //---//
            state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
            //--- DROPBITS(4) ---//
            hold >>>= 4;
            bits -= 4;
            //---//
    //#ifndef PKZIP_BUG_WORKAROUND
            if (state.nlen > 286 || state.ndist > 30) {
              strm.msg = 'too many length or distance symbols';
              state.mode = BAD;
              break;
            }
    //#endif
            //Tracev((stderr, "inflate:       table sizes ok\n"));
            state.have = 0;
            state.mode = LENLENS;
            /* falls through */
          case LENLENS:
            while (state.have < state.ncode) {
              //=== NEEDBITS(3);
              while (bits < 3) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
              //--- DROPBITS(3) ---//
              hold >>>= 3;
              bits -= 3;
              //---//
            }
            while (state.have < 19) {
              state.lens[order[state.have++]] = 0;
            }
            // We have separate tables & no pointers. 2 commented lines below not needed.
            //state.next = state.codes;
            //state.lencode = state.next;
            // Switch to use dynamic table
            state.lencode = state.lendyn;
            state.lenbits = 7;

            opts = { bits: state.lenbits };
            ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;

            if (ret) {
              strm.msg = 'invalid code lengths set';
              state.mode = BAD;
              break;
            }
            //Tracev((stderr, "inflate:       code lengths ok\n"));
            state.have = 0;
            state.mode = CODELENS;
            /* falls through */
          case CODELENS:
            while (state.have < state.nlen + state.ndist) {
              for (;;) {
                here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
                here_bits = here >>> 24;
                here_op = (here >>> 16) & 0xff;
                here_val = here & 0xffff;

                if ((here_bits) <= bits) { break; }
                //--- PULLBYTE() ---//
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
                //---//
              }
              if (here_val < 16) {
                //--- DROPBITS(here.bits) ---//
                hold >>>= here_bits;
                bits -= here_bits;
                //---//
                state.lens[state.have++] = here_val;
              }
              else {
                if (here_val === 16) {
                  //=== NEEDBITS(here.bits + 2);
                  n = here_bits + 2;
                  while (bits < n) {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  //===//
                  //--- DROPBITS(here.bits) ---//
                  hold >>>= here_bits;
                  bits -= here_bits;
                  //---//
                  if (state.have === 0) {
                    strm.msg = 'invalid bit length repeat';
                    state.mode = BAD;
                    break;
                  }
                  len = state.lens[state.have - 1];
                  copy = 3 + (hold & 0x03);//BITS(2);
                  //--- DROPBITS(2) ---//
                  hold >>>= 2;
                  bits -= 2;
                  //---//
                }
                else if (here_val === 17) {
                  //=== NEEDBITS(here.bits + 3);
                  n = here_bits + 3;
                  while (bits < n) {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  //===//
                  //--- DROPBITS(here.bits) ---//
                  hold >>>= here_bits;
                  bits -= here_bits;
                  //---//
                  len = 0;
                  copy = 3 + (hold & 0x07);//BITS(3);
                  //--- DROPBITS(3) ---//
                  hold >>>= 3;
                  bits -= 3;
                  //---//
                }
                else {
                  //=== NEEDBITS(here.bits + 7);
                  n = here_bits + 7;
                  while (bits < n) {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  //===//
                  //--- DROPBITS(here.bits) ---//
                  hold >>>= here_bits;
                  bits -= here_bits;
                  //---//
                  len = 0;
                  copy = 11 + (hold & 0x7f);//BITS(7);
                  //--- DROPBITS(7) ---//
                  hold >>>= 7;
                  bits -= 7;
                  //---//
                }
                if (state.have + copy > state.nlen + state.ndist) {
                  strm.msg = 'invalid bit length repeat';
                  state.mode = BAD;
                  break;
                }
                while (copy--) {
                  state.lens[state.have++] = len;
                }
              }
            }

            /* handle error breaks in while */
            if (state.mode === BAD) { break; }

            /* check for end-of-block code (better have one) */
            if (state.lens[256] === 0) {
              strm.msg = 'invalid code -- missing end-of-block';
              state.mode = BAD;
              break;
            }

            /* build code tables -- note: do not change the lenbits or distbits
               values here (9 and 6) without reading the comments in inftrees.h
               concerning the ENOUGH constants, which depend on those values */
            state.lenbits = 9;

            opts = { bits: state.lenbits };
            ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
            // We have separate tables & no pointers. 2 commented lines below not needed.
            // state.next_index = opts.table_index;
            state.lenbits = opts.bits;
            // state.lencode = state.next;

            if (ret) {
              strm.msg = 'invalid literal/lengths set';
              state.mode = BAD;
              break;
            }

            state.distbits = 6;
            //state.distcode.copy(state.codes);
            // Switch to use dynamic table
            state.distcode = state.distdyn;
            opts = { bits: state.distbits };
            ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
            // We have separate tables & no pointers. 2 commented lines below not needed.
            // state.next_index = opts.table_index;
            state.distbits = opts.bits;
            // state.distcode = state.next;

            if (ret) {
              strm.msg = 'invalid distances set';
              state.mode = BAD;
              break;
            }
            //Tracev((stderr, 'inflate:       codes ok\n'));
            state.mode = LEN_;
            if (flush === Z_TREES) { break inf_leave; }
            /* falls through */
          case LEN_:
            state.mode = LEN;
            /* falls through */
          case LEN:
            if (have >= 6 && left >= 258) {
              //--- RESTORE() ---
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              //---
              inflate_fast(strm, _out);
              //--- LOAD() ---
              put = strm.next_out;
              output = strm.output;
              left = strm.avail_out;
              next = strm.next_in;
              input = strm.input;
              have = strm.avail_in;
              hold = state.hold;
              bits = state.bits;
              //---

              if (state.mode === TYPE) {
                state.back = -1;
              }
              break;
            }
            state.back = 0;
            for (;;) {
              here = state.lencode[hold & ((1 << state.lenbits) - 1)];  /*BITS(state.lenbits)*/
              here_bits = here >>> 24;
              here_op = (here >>> 16) & 0xff;
              here_val = here & 0xffff;

              if (here_bits <= bits) { break; }
              //--- PULLBYTE() ---//
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
              //---//
            }
            if (here_op && (here_op & 0xf0) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (;;) {
                here = state.lencode[last_val +
                        ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
                here_bits = here >>> 24;
                here_op = (here >>> 16) & 0xff;
                here_val = here & 0xffff;

                if ((last_bits + here_bits) <= bits) { break; }
                //--- PULLBYTE() ---//
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
                //---//
              }
              //--- DROPBITS(last.bits) ---//
              hold >>>= last_bits;
              bits -= last_bits;
              //---//
              state.back += last_bits;
            }
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            state.back += here_bits;
            state.length = here_val;
            if (here_op === 0) {
              //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
              //        "inflate:         literal '%c'\n" :
              //        "inflate:         literal 0x%02x\n", here.val));
              state.mode = LIT;
              break;
            }
            if (here_op & 32) {
              //Tracevv((stderr, "inflate:         end of block\n"));
              state.back = -1;
              state.mode = TYPE;
              break;
            }
            if (here_op & 64) {
              strm.msg = 'invalid literal/length code';
              state.mode = BAD;
              break;
            }
            state.extra = here_op & 15;
            state.mode = LENEXT;
            /* falls through */
          case LENEXT:
            if (state.extra) {
              //=== NEEDBITS(state.extra);
              n = state.extra;
              while (bits < n) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              state.length += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
              //--- DROPBITS(state.extra) ---//
              hold >>>= state.extra;
              bits -= state.extra;
              //---//
              state.back += state.extra;
            }
            //Tracevv((stderr, "inflate:         length %u\n", state.length));
            state.was = state.length;
            state.mode = DIST;
            /* falls through */
          case DIST:
            for (;;) {
              here = state.distcode[hold & ((1 << state.distbits) - 1)];/*BITS(state.distbits)*/
              here_bits = here >>> 24;
              here_op = (here >>> 16) & 0xff;
              here_val = here & 0xffff;

              if ((here_bits) <= bits) { break; }
              //--- PULLBYTE() ---//
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
              //---//
            }
            if ((here_op & 0xf0) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (;;) {
                here = state.distcode[last_val +
                        ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
                here_bits = here >>> 24;
                here_op = (here >>> 16) & 0xff;
                here_val = here & 0xffff;

                if ((last_bits + here_bits) <= bits) { break; }
                //--- PULLBYTE() ---//
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
                //---//
              }
              //--- DROPBITS(last.bits) ---//
              hold >>>= last_bits;
              bits -= last_bits;
              //---//
              state.back += last_bits;
            }
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            state.back += here_bits;
            if (here_op & 64) {
              strm.msg = 'invalid distance code';
              state.mode = BAD;
              break;
            }
            state.offset = here_val;
            state.extra = (here_op) & 15;
            state.mode = DISTEXT;
            /* falls through */
          case DISTEXT:
            if (state.extra) {
              //=== NEEDBITS(state.extra);
              n = state.extra;
              while (bits < n) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              state.offset += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
              //--- DROPBITS(state.extra) ---//
              hold >>>= state.extra;
              bits -= state.extra;
              //---//
              state.back += state.extra;
            }
    //#ifdef INFLATE_STRICT
            if (state.offset > state.dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break;
            }
    //#endif
            //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
            state.mode = MATCH;
            /* falls through */
          case MATCH:
            if (left === 0) { break inf_leave; }
            copy = _out - left;
            if (state.offset > copy) {         /* copy from window */
              copy = state.offset - copy;
              if (copy > state.whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break;
                }
    // (!) This block is disabled in zlib defaults,
    // don't enable it for binary compatibility
    //#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
    //          Trace((stderr, "inflate.c too far\n"));
    //          copy -= state.whave;
    //          if (copy > state.length) { copy = state.length; }
    //          if (copy > left) { copy = left; }
    //          left -= copy;
    //          state.length -= copy;
    //          do {
    //            output[put++] = 0;
    //          } while (--copy);
    //          if (state.length === 0) { state.mode = LEN; }
    //          break;
    //#endif
              }
              if (copy > state.wnext) {
                copy -= state.wnext;
                from = state.wsize - copy;
              }
              else {
                from = state.wnext - copy;
              }
              if (copy > state.length) { copy = state.length; }
              from_source = state.window;
            }
            else {                              /* copy from output */
              from_source = output;
              from = put - state.offset;
              copy = state.length;
            }
            if (copy > left) { copy = left; }
            left -= copy;
            state.length -= copy;
            do {
              output[put++] = from_source[from++];
            } while (--copy);
            if (state.length === 0) { state.mode = LEN; }
            break;
          case LIT:
            if (left === 0) { break inf_leave; }
            output[put++] = state.length;
            left--;
            state.mode = LEN;
            break;
          case CHECK:
            if (state.wrap) {
              //=== NEEDBITS(32);
              while (bits < 32) {
                if (have === 0) { break inf_leave; }
                have--;
                // Use '|' instead of '+' to make sure that result is signed
                hold |= input[next++] << bits;
                bits += 8;
              }
              //===//
              _out -= left;
              strm.total_out += _out;
              state.total += _out;
              if (_out) {
                strm.adler = state.check =
                    /*UPDATE(state.check, put - _out, _out);*/
                    (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

              }
              _out = left;
              // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
              if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                strm.msg = 'incorrect data check';
                state.mode = BAD;
                break;
              }
              //=== INITBITS();
              hold = 0;
              bits = 0;
              //===//
              //Tracev((stderr, "inflate:   check matches trailer\n"));
            }
            state.mode = LENGTH;
            /* falls through */
          case LENGTH:
            if (state.wrap && state.flags) {
              //=== NEEDBITS(32);
              while (bits < 32) {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              //===//
              if (hold !== (state.total & 0xffffffff)) {
                strm.msg = 'incorrect length check';
                state.mode = BAD;
                break;
              }
              //=== INITBITS();
              hold = 0;
              bits = 0;
              //===//
              //Tracev((stderr, "inflate:   length matches trailer\n"));
            }
            state.mode = DONE;
            /* falls through */
          case DONE:
            ret = Z_STREAM_END;
            break inf_leave;
          case BAD:
            ret = Z_DATA_ERROR;
            break inf_leave;
          case MEM:
            return Z_MEM_ERROR;
          case SYNC:
            /* falls through */
          default:
            return Z_STREAM_ERROR;
        }
      }

      // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

      /*
         Return from inflate(), updating the total counts and the check value.
         If there was no progress during the inflate() call, return a buffer
         error.  Call updatewindow() to create and/or update the window state.
         Note: a memory error from inflate() is non-recoverable.
       */

      //--- RESTORE() ---
      strm.next_out = put;
      strm.avail_out = left;
      strm.next_in = next;
      strm.avail_in = have;
      state.hold = hold;
      state.bits = bits;
      //---

      if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                          (state.mode < CHECK || flush !== Z_FINISH))) {
        if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
          state.mode = MEM;
          return Z_MEM_ERROR;
        }
      }
      _in -= strm.avail_in;
      _out -= strm.avail_out;
      strm.total_in += _in;
      strm.total_out += _out;
      state.total += _out;
      if (state.wrap && _out) {
        strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
          (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
      }
      strm.data_type = state.bits + (state.last ? 64 : 0) +
                        (state.mode === TYPE ? 128 : 0) +
                        (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
      if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
        ret = Z_BUF_ERROR;
      }
      return ret;
    };


    const inflateEnd = (strm) => {

      if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
        return Z_STREAM_ERROR;
      }

      let state = strm.state;
      if (state.window) {
        state.window = null;
      }
      strm.state = null;
      return Z_OK;
    };


    const inflateGetHeader = (strm, head) => {

      /* check state */
      if (!strm || !strm.state) { return Z_STREAM_ERROR; }
      const state = strm.state;
      if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

      /* save header structure */
      state.head = head;
      head.done = false;
      return Z_OK;
    };


    const inflateSetDictionary = (strm, dictionary) => {
      const dictLength = dictionary.length;

      let state;
      let dictid;
      let ret;

      /* check state */
      if (!strm /* == Z_NULL */ || !strm.state /* == Z_NULL */) { return Z_STREAM_ERROR; }
      state = strm.state;

      if (state.wrap !== 0 && state.mode !== DICT) {
        return Z_STREAM_ERROR;
      }

      /* check for correct dictionary identifier */
      if (state.mode === DICT) {
        dictid = 1; /* adler32(0, null, 0)*/
        /* dictid = adler32(dictid, dictionary, dictLength); */
        dictid = adler32(dictid, dictionary, dictLength, 0);
        if (dictid !== state.check) {
          return Z_DATA_ERROR;
        }
      }
      /* copy dictionary to window using updatewindow(), which will amend the
       existing dictionary if appropriate */
      ret = updatewindow(strm, dictionary, dictLength, dictLength);
      if (ret) {
        state.mode = MEM;
        return Z_MEM_ERROR;
      }
      state.havedict = 1;
      // Tracev((stderr, "inflate:   dictionary set\n"));
      return Z_OK;
    };


    return compression.inflates = {
        inflateReset,
        inflateReset2,
        inflateResetKeep,
        inflateInit,
        inflateInit2,
        inflate,
        inflateEnd,
        inflateGetHeader,
        inflateSetDictionary,
        inflateInfo : 'skylarkjs inflate (from Nodeca project)'
    };
});
define('skylark-langx-compression/gzheader',[
    "./compression"
], function (compression) {
    'use strict';
    // Original version : zlib 1.2.8
    // (C) 1995-2013 Jean-loup Gailly and Mark Adler
    // (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin

    function GZheader() {
      /* true if compressed data believed to be text */
      this.text       = 0;
      /* modification time */
      this.time       = 0;
      /* extra flags (not used when writing a gzip file) */
      this.xflags     = 0;
      /* operating system */
      this.os         = 0;
      /* pointer to extra field or Z_NULL if none */
      this.extra      = null;
      /* extra field length (valid if extra != Z_NULL) */
      this.extra_len  = 0; // Actually, we don't need it in JS,
                           // but leave for few code modifications

      //
      // Setup limits is not necessary because in js we should not preallocate memory
      // for inflate use constant limit in 65536 bytes
      //

      /* space at extra (only when reading header) */
      // this.extra_max  = 0;
      /* pointer to zero-terminated file name or Z_NULL */
      this.name       = '';
      /* space at name (only when reading header) */
      // this.name_max   = 0;
      /* pointer to zero-terminated comment or Z_NULL */
      this.comment    = '';
      /* space at comment (only when reading header) */
      // this.comm_max   = 0;
      /* true if there was or will be a header crc */
      this.hcrc       = 0;
      /* true when done reading gzip header (not used when writing a gzip file) */
      this.done       = false;
    }

    return  compression.GZheader = GZheader;

});
define('skylark-pako/inflates',[
    'skylark-langx-compression/inflates',
    'skylark-langx-compression/messages',
    'skylark-langx-compression/zstream',
    'skylark-langx-compression/constants',
    'skylark-langx-compression/gzheader',
    './utils/common',
    './utils/strings'

], function (zlib_inflate, msg, ZStream, constants,GZheader,utils, strings) {
    'use strict';


    const toString = Object.prototype.toString;
    const {Z_NO_FLUSH, Z_FINISH, Z_OK, Z_STREAM_END, Z_NEED_DICT, Z_STREAM_ERROR, Z_DATA_ERROR, Z_MEM_ERROR} = constants;
    /* ===========================================================================*/


    /**
     * class Inflate
     *
     * Generic JS-style wrapper for zlib calls. If you don't need
     * streaming behaviour - use more simple functions: [[inflate]]
     * and [[inflateRaw]].
     **/

    /* internal
     * inflate.chunks -> Array
     *
     * Chunks of output data, if [[Inflate#onData]] not overridden.
     **/

    /**
     * Inflate.result -> Uint8Array|String
     *
     * Uncompressed result, generated by default [[Inflate#onData]]
     * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
     * (call [[Inflate#push]] with `Z_FINISH` / `true` param).
     **/

    /**
     * Inflate.err -> Number
     *
     * Error code after inflate finished. 0 (Z_OK) on success.
     * Should be checked if broken data possible.
     **/

    /**
     * Inflate.msg -> String
     *
     * Error message, if [[Inflate.err]] != 0
     **/


    /**
     * new Inflate(options)
     * - options (Object): zlib inflate options.
     *
     * Creates new inflator instance with specified params. Throws exception
     * on bad params. Supported options:
     *
     * - `windowBits`
     * - `dictionary`
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Additional options, for internal needs:
     *
     * - `chunkSize` - size of generated data chunks (16K by default)
     * - `raw` (Boolean) - do raw inflate
     * - `to` (String) - if equal to 'string', then result will be converted
     *   from utf8 to utf16 (javascript) string. When string output requested,
     *   chunk length can differ from `chunkSize`, depending on content.
     *
     * By default, when no options set, autodetect deflate/gzip data format via
     * wrapper header.
     *
     * ##### Example:
     *
     * ```javascript
     * const pako = require('pako')
     * const chunk1 = new Uint8Array([1,2,3,4,5,6,7,8,9])
     * const chunk2 = new Uint8Array([10,11,12,13,14,15,16,17,18,19]);
     *
     * const inflate = new pako.Inflate({ level: 3});
     *
     * inflate.push(chunk1, false);
     * inflate.push(chunk2, true);  // true -> last chunk
     *
     * if (inflate.err) { throw new Error(inflate.err); }
     *
     * console.log(inflate.result);
     * ```
     **/
    function Inflate(options) {
      this.options = utils.assign({
        chunkSize: 1024 * 64,
        windowBits: 15,
        to: ''
      }, options || {});

      const opt = this.options;

      // Force window size for `raw` data, if not set directly,
      // because we have no header for autodetect.
      if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
        opt.windowBits = -opt.windowBits;
        if (opt.windowBits === 0) { opt.windowBits = -15; }
      }

      // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
      if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
          !(options && options.windowBits)) {
        opt.windowBits += 32;
      }

      // Gzip header has no info about windows size, we can do autodetect only
      // for deflate. So, if window size not set, force it to max when gzip possible
      if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
        // bit 3 (16) -> gzipped data
        // bit 4 (32) -> autodetect gzip/deflate
        if ((opt.windowBits & 15) === 0) {
          opt.windowBits |= 15;
        }
      }

      this.err    = 0;      // error code, if happens (0 = Z_OK)
      this.msg    = '';     // error message
      this.ended  = false;  // used to avoid multiple onEnd() calls
      this.chunks = [];     // chunks of compressed data

      this.strm   = new ZStream();
      this.strm.avail_out = 0;

      let status  = zlib_inflate.inflateInit2(
        this.strm,
        opt.windowBits
      );

      if (status !== Z_OK) {
        throw new Error(msg[status]);
      }

      this.header = new GZheader();

      zlib_inflate.inflateGetHeader(this.strm, this.header);

      // Setup dictionary
      if (opt.dictionary) {
        // Convert data if needed
        if (typeof opt.dictionary === 'string') {
          opt.dictionary = strings.string2buf(opt.dictionary);
        } else if (toString.call(opt.dictionary) === '[object ArrayBuffer]') {
          opt.dictionary = new Uint8Array(opt.dictionary);
        }
        if (opt.raw) { //In raw mode we need to set the dictionary early
          status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
          if (status !== Z_OK) {
            throw new Error(msg[status]);
          }
        }
      }
    }

    /**
     * Inflate#push(data[, flush_mode]) -> Boolean
     * - data (Uint8Array|ArrayBuffer): input data
     * - flush_mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE
     *   flush modes. See constants. Skipped or `false` means Z_NO_FLUSH,
     *   `true` means Z_FINISH.
     *
     * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
     * new output chunks. Returns `true` on success. If end of stream detected,
     * [[Inflate#onEnd]] will be called.
     *
     * `flush_mode` is not needed for normal operation, because end of stream
     * detected automatically. You may try to use it for advanced things, but
     * this functionality was not tested.
     *
     * On fail call [[Inflate#onEnd]] with error code and return false.
     *
     * ##### Example
     *
     * ```javascript
     * push(chunk, false); // push one of data chunks
     * ...
     * push(chunk, true);  // push last chunk
     * ```
     **/
    Inflate.prototype.push = function (data, flush_mode) {
      const strm = this.strm;
      const chunkSize = this.options.chunkSize;
      const dictionary = this.options.dictionary;
      let status, _flush_mode, last_avail_out;

      if (this.ended) return false;

      if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
      else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;

      // Convert data if needed
      if (toString.call(data) === '[object ArrayBuffer]') {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }

      strm.next_in = 0;
      strm.avail_in = strm.input.length;

      for (;;) {
        if (strm.avail_out === 0) {
          strm.output = new Uint8Array(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }

        status = zlib_inflate.inflate(strm, _flush_mode);

        if (status === Z_NEED_DICT && dictionary) {
          status = zlib_inflate.inflateSetDictionary(strm, dictionary);

          if (status === Z_OK) {
            status = zlib_inflate.inflate(strm, _flush_mode);
          } else if (status === Z_DATA_ERROR) {
            // Replace code with more verbose
            status = Z_NEED_DICT;
          }
        }

        // Skip snyc markers if more data follows and not raw mode
        while (strm.avail_in > 0 &&
               status === Z_STREAM_END &&
               strm.state.wrap > 0 &&
               data[strm.next_in] !== 0)
        {
          zlib_inflate.inflateReset(strm);
          status = zlib_inflate.inflate(strm, _flush_mode);
        }

        switch (status) {
          case Z_STREAM_ERROR:
          case Z_DATA_ERROR:
          case Z_NEED_DICT:
          case Z_MEM_ERROR:
            this.onEnd(status);
            this.ended = true;
            return false;
        }

        // Remember real `avail_out` value, because we may patch out buffer content
        // to align utf8 strings boundaries.
        last_avail_out = strm.avail_out;

        if (strm.next_out) {
          if (strm.avail_out === 0 || status === Z_STREAM_END) {

            if (this.options.to === 'string') {

              let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

              let tail = strm.next_out - next_out_utf8;
              let utf8str = strings.buf2string(strm.output, next_out_utf8);

              // move tail & realign counters
              strm.next_out = tail;
              strm.avail_out = chunkSize - tail;
              if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);

              this.onData(utf8str);

            } else {
              this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
            }
          }
        }

        // Must repeat iteration if out buffer is full
        if (status === Z_OK && last_avail_out === 0) continue;

        // Finalize if end of stream reached.
        if (status === Z_STREAM_END) {
          status = zlib_inflate.inflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return true;
        }

        if (strm.avail_in === 0) break;
      }

      return true;
    };


    /**
     * Inflate#onData(chunk) -> Void
     * - chunk (Uint8Array|String): output data. When string output requested,
     *   each chunk will be string.
     *
     * By default, stores data blocks in `chunks[]` property and glue
     * those in `onEnd`. Override this handler, if you need another behaviour.
     **/
    Inflate.prototype.onData = function (chunk) {
      this.chunks.push(chunk);
    };


    /**
     * Inflate#onEnd(status) -> Void
     * - status (Number): inflate status. 0 (Z_OK) on success,
     *   other if not.
     *
     * Called either after you tell inflate that the input stream is
     * complete (Z_FINISH). By default - join collected chunks,
     * free memory and fill `results` / `err` properties.
     **/
    Inflate.prototype.onEnd = function (status) {
      // On success - join
      if (status === Z_OK) {
        if (this.options.to === 'string') {
          this.result = this.chunks.join('');
        } else {
          this.result = utils.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };


    /**
     * inflate(data[, options]) -> Uint8Array|String
     * - data (Uint8Array): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * Decompress `data` with inflate/ungzip and `options`. Autodetect
     * format via wrapper header by default. That's why we don't provide
     * separate `ungzip` method.
     *
     * Supported options are:
     *
     * - windowBits
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information.
     *
     * Sugar (options):
     *
     * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
     *   negative windowBits implicitly.
     * - `to` (String) - if equal to 'string', then result will be converted
     *   from utf8 to utf16 (javascript) string. When string output requested,
     *   chunk length can differ from `chunkSize`, depending on content.
     *
     *
     * ##### Example:
     *
     * ```javascript
     * const pako = require('pako');
     * const input = pako.deflate(new Uint8Array([1,2,3,4,5,6,7,8,9]));
     * let output;
     *
     * try {
     *   output = pako.inflate(input);
     * } catch (err) {
     *   console.log(err);
     * }
     * ```
     **/
    function inflate(input, options) {
      const inflator = new Inflate(options);

      inflator.push(input);

      // That will never happens, if you don't cheat with options :)
      if (inflator.err) throw inflator.msg || msg[inflator.err];

      return inflator.result;
    }


    /**
     * inflateRaw(data[, options]) -> Uint8Array|String
     * - data (Uint8Array): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * The same as [[inflate]], but creates raw data, without wrapper
     * (header and adler32 crc).
     **/
    function inflateRaw(input, options) {
      options = options || {};
      options.raw = true;
      return inflate(input, options);
    }


    /**
     * ungzip(data[, options]) -> Uint8Array|String
     * - data (Uint8Array): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * Just shortcut to [[inflate]], because it autodetects format
     * by header.content. Done for convenience.
     **/


    return {
        Inflate,
        inflate,
        inflateRaw,
        ungzip : inflate,
        constants
    };
  
});
define('skylark-pako/main',[
    "skylark-langx-ns",
    "skylark-langx-compression/constants",
    "./deflates",
    "./inflates"
], function(skylark, constants,deflates,inflates) {


    var pako= skylark.attach("intg.pako", {
        deflates,
        inflates
    });

	const { Deflate, deflate, deflateRaw, gzip } = deflates;

	const { Inflate, inflate, inflateRaw, ungzip } = inflates;


	pako.Deflate = Deflate;
	pako.deflate = deflate;
	pako.deflateRaw = deflateRaw;
	pako.gzip = gzip;
	pako.Inflate = Inflate;
	pako.inflate = inflate;
	pako.inflateRaw = inflateRaw;
	pako.ungzip = ungzip;
	pako.constants = constants;

	return pako;
});
define('skylark-pako', ['skylark-pako/main'], function (main) { return main; });

define('skylark-jszip/flate',[
    'skylark-pako',
    './utils',
    './stream/GenericWorker'
], function (pako, utils, GenericWorker) {
    'use strict';

    var USE_TYPEDARRAY = typeof Uint8Array !== 'undefined' && typeof Uint16Array !== 'undefined' && typeof Uint32Array !== 'undefined';

    var ARRAY_TYPE = USE_TYPEDARRAY ? 'uint8array' : 'array';

    var flate = {};

    flate.magic = '\b\0';

    function FlateWorker(action, options) {
        GenericWorker.call(this, 'FlateWorker/' + action);
        this._pako = null;
        this._pakoAction = action;
        this._pakoOptions = options;
        this.meta = {};
    }

    utils.inherits(FlateWorker, GenericWorker);

    FlateWorker.prototype.processChunk = function (chunk) {
        this.meta = chunk.meta;
        if (this._pako === null) {
            this._createPako();
        }
        this._pako.push(utils.transformTo(ARRAY_TYPE, chunk.data), false);
    };
    FlateWorker.prototype.flush = function () {
        GenericWorker.prototype.flush.call(this);
        if (this._pako === null) {
            this._createPako();
        }
        this._pako.push([], true);
    };
    FlateWorker.prototype.cleanUp = function () {
        GenericWorker.prototype.cleanUp.call(this);
        this._pako = null;
    };
    FlateWorker.prototype._createPako = function () {
        this._pako = new pako[this._pakoAction]({
            raw: true,
            level: this._pakoOptions.level || -1
        });
        var self = this;
        this._pako.onData = function (data) {
            self.push({
                data: data,
                meta: self.meta
            });
        };
    };

    flate.compressWorker = function (compressionOptions) {
        return new FlateWorker("Deflate", compressionOptions);
    };
    flate.uncompressWorker = function () {
        return new FlateWorker("Inflate", {});
    };

    return flate;
});
define('skylark-jszip/compressions',[
    './stream/GenericWorker',
    './flate'
], function (GenericWorker, DEFLATE) {
    'use strict';

    var STORE = {
        magic: '\0\0',
        compressWorker: function () {
            return new GenericWorker('STORE compression');
        },
        uncompressWorker: function () {
            return new GenericWorker('STORE decompression');
        }
    };

    return {
        STORE,
        DEFLATE
    }
});
define('skylark-jszip/signature',[], function () {
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
define('skylark-jszip/generate/ZipFileWorker',[
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
define('skylark-jszip/generate',[
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
define('skylark-jszip/object',[
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
define('skylark-io-readers/readers',[
    "skylark-langx-ns"
], function(skylark) {

    return skylark.attach("io.readers");
});

define('skylark-langx-events/events',[
	"skylark-langx-ns"
],function(skylark){
	return skylark.attach("langx.events",{});
});
define('skylark-langx-klass/klass',[
  "skylark-langx-ns",
  "skylark-langx-constructs"
],function(skylark,constructs){

    return skylark.attach("langx.klass",constructs.klass);
});
define('skylark-langx-klass/main',[
	"./klass"
],function(klass){
	return klass;
});
define('skylark-langx-klass', ['skylark-langx-klass/main'], function (main) { return main; });

define('skylark-langx-hoster/hoster',[
    "skylark-langx-ns"
],function(skylark){
	// The javascript host environment, brower and nodejs are supported.
	var hoster = {
		"isBrowser" : true, // default
		"isNode" : null,
		"global" : this,
		"browser" : null,
		"node" : null
	};

	if (typeof process == "object" && process.versions && process.versions.node && process.versions.v8) {
		hoster.isNode = true;
		hoster.isBrowser = false;
	}

	hoster.global = (function(){
		if (typeof global !== 'undefined' && typeof global !== 'function') {
			// global spec defines a reference to the global object called 'global'
			// https://github.com/tc39/proposal-global
			// `global` is also defined in NodeJS
			return global;
		} else if (typeof window !== 'undefined') {
			// window is defined in browsers
			return window;
		}
		else if (typeof self !== 'undefined') {
			// self is defined in WebWorkers
			return self;
		}
		return this;
	})();

	var _document = null;

	Object.defineProperty(hoster,"document",function(){
		if (!_document) {
			var w = typeof window === 'undefined' ? require('html-element') : window;
			_document = w.document;
		}

		return _document;
	});

	if (hoster.global.CustomEvent === undefined) {
		hoster.global.CustomEvent = function(type,props) {
			this.type = type;
			this.props = props;
		};
	}

	if (hoster.isBrowser) {
	    function uaMatch( ua ) {
		    ua = ua.toLowerCase();

			//IE11OrLess = !!navigator.userAgent.match(/(?:Trident.*rv[ :]?11\.|msie|iemobile)/i),
			//Edge = !!navigator.userAgent.match(/Edge/i),
			//FireFox = !!navigator.userAgent.match(/firefox/i),
			//Safari = !!(navigator.userAgent.match(/safari/i) && !navigator.userAgent.match(/chrome/i) && !navigator.userAgent.match(/android/i)),
			//IOS = !!(navigator.userAgent.match(/iP(ad|od|hone)/i)),

		    var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
		      /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
		      /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
		      /(msie) ([\w.]+)/.exec( ua ) ||
		      ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
		      [];

		    return {
		      browser: match[ 1 ] || '',
		      version: match[ 2 ] || '0'
		    };
	  	};

	    var matched = uaMatch( navigator.userAgent );

	    var browser = hoster.browser = {};

	    if ( matched.browser ) {
	      browser[ matched.browser ] = true;
	      browser.version = matched.version;
	    }

	    // Chrome is Webkit, but Webkit is also Safari.
	    if ( browser.chrome ) {
	      browser.webkit = true;
	    } else if ( browser.webkit ) {
	      browser.safari = true;
	    }
	}

	hoster.detects = {};

	return  skylark.attach("langx.hoster",hoster);
});
define('skylark-langx-hoster/detects/mobile',[
    "../hoster"
],function(hoster){
    //refer : https://github.com/kaimallea/isMobile

    var appleIphone = /iPhone/i;
    var appleIpod = /iPod/i;
    var appleTablet = /iPad/i;
    var appleUniversal = /\biOS-universal(?:.+)Mac\b/i;
    var androidPhone = /\bAndroid(?:.+)Mobile\b/i;
    var androidTablet = /Android/i;
    var amazonPhone = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i;
    var amazonTablet = /Silk/i;
    var windowsPhone = /Windows Phone/i;
    var windowsTablet = /\bWindows(?:.+)ARM\b/i;
    var otherBlackBerry = /BlackBerry/i;
    var otherBlackBerry10 = /BB10/i;
    var otherOpera = /Opera Mini/i;
    var otherChrome = /\b(CriOS|Chrome)(?:.+)Mobile/i;
    var otherFirefox = /Mobile(?:.+)Firefox\b/i;
    var isAppleTabletOnIos13 = function (navigator) {
        return (typeof navigator !== 'undefined' &&
            navigator.platform === 'MacIntel' &&
            typeof navigator.maxTouchPoints === 'number' &&
            navigator.maxTouchPoints > 1 &&
            typeof MSStream === 'undefined');
    };
    function createMatch(userAgent) {
        return function (regex) { return regex.test(userAgent); };
    }
    
    function detectMobile(param) {
        var nav = {
            userAgent: '',
            platform: '',
            maxTouchPoints: 0
        };
        if (!param && typeof navigator !== 'undefined') {
            nav = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                maxTouchPoints: navigator.maxTouchPoints || 0
            };
        }
        else if (typeof param === 'string') {
            nav.userAgent = param;
        }
        else if (param && param.userAgent) {
            nav = {
                userAgent: param.userAgent,
                platform: param.platform,
                maxTouchPoints: param.maxTouchPoints || 0
            };
        }
        var userAgent = nav.userAgent;
        var tmp = userAgent.split('[FBAN');
        if (typeof tmp[1] !== 'undefined') {
            userAgent = tmp[0];
        }
        tmp = userAgent.split('Twitter');
        if (typeof tmp[1] !== 'undefined') {
            userAgent = tmp[0];
        }
        var match = createMatch(userAgent);
        var result = {
            apple: {
                phone: match(appleIphone) && !match(windowsPhone),
                ipod: match(appleIpod),
                tablet: !match(appleIphone) &&
                    (match(appleTablet) || isAppleTabletOnIos13(nav)) &&
                    !match(windowsPhone),
                universal: match(appleUniversal),
                device: (match(appleIphone) ||
                    match(appleIpod) ||
                    match(appleTablet) ||
                    match(appleUniversal) ||
                    isAppleTabletOnIos13(nav)) &&
                    !match(windowsPhone)
            },
            amazon: {
                phone: match(amazonPhone),
                tablet: !match(amazonPhone) && match(amazonTablet),
                device: match(amazonPhone) || match(amazonTablet)
            },
            android: {
                phone: (!match(windowsPhone) && match(amazonPhone)) ||
                    (!match(windowsPhone) && match(androidPhone)),
                tablet: !match(windowsPhone) &&
                    !match(amazonPhone) &&
                    !match(androidPhone) &&
                    (match(amazonTablet) || match(androidTablet)),
                device: (!match(windowsPhone) &&
                    (match(amazonPhone) ||
                        match(amazonTablet) ||
                        match(androidPhone) ||
                        match(androidTablet))) ||
                    match(/\bokhttp\b/i)
            },
            windows: {
                phone: match(windowsPhone),
                tablet: match(windowsTablet),
                device: match(windowsPhone) || match(windowsTablet)
            },
            other: {
                blackberry: match(otherBlackBerry),
                blackberry10: match(otherBlackBerry10),
                opera: match(otherOpera),
                firefox: match(otherFirefox),
                chrome: match(otherChrome),
                device: match(otherBlackBerry) ||
                    match(otherBlackBerry10) ||
                    match(otherOpera) ||
                    match(otherFirefox) ||
                    match(otherChrome)
            },
            any: false,
            phone: false,
            tablet: false
        };
        result.any =
            result.apple.device ||
                result.android.device ||
                result.windows.device ||
                result.other.device;
        result.phone =
            result.apple.phone || result.android.phone || result.windows.phone;
        result.tablet =
            result.apple.tablet || result.android.tablet || result.windows.tablet;
        return result;
    }

    return hoster.detects.mobile = detectMobile;
});

define('skylark-langx-hoster/is-mobile',[
    "./hoster",
    "./detects/mobile"
],function(hoster,detectMobile){
    if (hoster.isMobile == undefined) {
        hoster.isMobile = detectMobile();
    }

    return hoster.isMobile;
});

define('skylark-langx-hoster/main',[
	"./hoster",
	"./is-mobile"
],function(hoster){
	return hoster;
});
define('skylark-langx-hoster', ['skylark-langx-hoster/main'], function (main) { return main; });

define('skylark-langx-events/event',[
  "skylark-langx-objects",
  "skylark-langx-funcs",
  "skylark-langx-klass",
  "skylark-langx-hoster",
    "./events"
],function(objects,funcs,klass,events){
    var eventMethods = {
        preventDefault: "isDefaultPrevented",
        stopImmediatePropagation: "isImmediatePropagationStopped",
        stopPropagation: "isPropagationStopped"
     };
        

    function compatible(event, source) {
        if (source || !event.isDefaultPrevented) {
            if (!source) {
                source = event;
            }

            objects.each(eventMethods, function(name, predicate) {
                var sourceMethod = source[name];
                event[name] = function() {
                    this[predicate] = funcs.returnTrue;
                    return sourceMethod && sourceMethod.apply(source, arguments);
                }
                event[predicate] = funcs.returnFalse;
            });
        }
        return event;
    }


    /*
    var Event = klass({
        _construct : function(type,props) {
            CustomEvent.call(this,type.props);
            objects.safeMixin(this, props);
            compatible(this);
        }
    },CustomEvent);
    */

    class Event extends CustomEvent {
        constructor(type,props) {
            super(type,props);
            objects.safeMixin(this, props);
            compatible(this);
        } 
    }


    Event.compatible = compatible;

    return events.Event = Event;
    
});
define('skylark-langx-events/listener',[
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
  "skylark-langx-klass",
  "./events",
  "./event"
],function(types,objects,arrays,klass,events,Event){
    var slice = Array.prototype.slice,
        compact = arrays.compact,
        isDefined = types.isDefined,
        isUndefined = types.isUndefined,
        isPlainObject = types.isPlainObject,
        isFunction = types.isFunction,
        isBoolean = types.isBoolean,
        isString = types.isString,
        isEmptyObject = types.isEmptyObject,
        mixin = objects.mixin,
        safeMixin = objects.safeMixin;


    var Listener = klass({

        listenTo: function(obj, event, selector,callback, /*used internally*/ one) {
            if (!obj) {
                return this;
            }

            if (types.isPlainObject(event)){
                //listenTo(obj,callbacks,one)
                if (types.isBoolean(selector)) {
                    one = selector;
                    selector = null;
                } else if (types.isBoolean(callback)) {
                    one = callback;
                }
                var callbacks = event;
                for (var name in callbacks) {

                    var match = name.match( /^([\w:-]*)\s*(.*)$/ );
                    var name1 = match[ 1 ];
                    var selector1 = match[ 2 ] || selector;

                    if (selector1) {
                        this.listenTo(obj,name1,selector1,callbacks[name],one);
                    } else {
                        this.listenTo(obj,name1,callbacks[name],one);
                    }

                }
                return this;
            }

            if (isBoolean(callback)) {
                one = callback;
                callback = selector;
                selector = null;
            } else if (isBoolean(selector)) {
                one = selector;
                callback = selector = null;
            } else if (isUndefined(callback)){
                one = false;
                callback = selector;
                selector = null;
            }



            if (!callback) {
                callback = "handleEvent";
            }
            
            // Bind callbacks on obj,
            if (isString(callback)) {
                callback = this[callback];
            }

            var emitter = this.ensureListenedEmitter(obj)

            if (one) {
                if (selector) {
                    emitter.one(event, selector,callback, this);
                } else {
                    emitter.one(event, callback, this);
                }
            } else {
                 if (selector) {
                    emitter.on(event, selector, callback, this);
                } else {
                    emitter.on(event, callback, this);
                }
            }

            //keep track of them on listening.
            var listeningTo = this._listeningTo || (this._listeningTo = []),
                listening;

            for (var i = 0; i < listeningTo.length; i++) {
                if (listeningTo[i].obj == obj) {
                    listening = listeningTo[i];
                    break;
                }
            }
            if (!listening) {
                listeningTo.push(
                    listening = {
                        obj: obj,
                        events: {}
                    }
                );
            }
            var listeningEvents = listening.events,
                listeningEvent = listeningEvents[event] = listeningEvents[event] || [];
            if (listeningEvent.indexOf(callback) == -1) {
                listeningEvent.push(callback);
            }

            return this;
        },

        listenToOnce: function(obj, event,selector, callback) {
            return this.listenTo(obj, event,selector, callback, 1);
        },

        unlistenTo: function(obj, event, callback) {
            var listeningTo = this._listeningTo;
            if (!listeningTo) {
                return this;
            }

            if (isString(callback)) {
                callback = this[callback];
            }

            for (var i = 0; i < listeningTo.length; i++) {
                var listening = listeningTo[i];

                if (obj && obj != listening.obj) {
                    continue;
                }

                var listeningEvents = listening.events;

                for (var eventName in listeningEvents) {
                    if (event && event != eventName) {
                        continue;
                    }

                    var listeningEvent = listeningEvents[eventName];

                    if (!listeningEvent) { 
                        continue;
                    }

                    for (var j = 0; j < listeningEvent.length; j++) {
                        if (!callback || callback == listeningEvent[i]) {
                            let emitter = this.ensureListenedEmitter(listening.obj);
                            emitter.off(eventName, listeningEvent[i], this);
                            listeningEvent[i] = null;
                        }
                    }

                    listeningEvent = listeningEvents[eventName] = compact(listeningEvent);

                    if (isEmptyObject(listeningEvent)) {
                        listeningEvents[eventName] = null;
                    }

                }

                if (isEmptyObject(listeningEvents)) {
                    listeningTo[i] = null;
                }
            }

            listeningTo = this._listeningTo = compact(listeningTo);
            if (isEmptyObject(listeningTo)) {
                this._listeningTo = null;
            }

            return this;
        },

        ensureListenedEmitter : function(obj) {
            return obj;
        }
    });

    return events.Listener = Listener;

});
define('skylark-langx-events/emitter',[
  "skylark-langx-types",
  "skylark-langx-objects",
  "skylark-langx-arrays",
  "skylark-langx-klass",
  "./events",
  "./event",
  "./listener"
],function(types,objects,arrays,klass,events,Event,Listener){
    var slice = Array.prototype.slice,
        compact = arrays.compact,
        isDefined = types.isDefined,
        isPlainObject = types.isPlainObject,
        isFunction = types.isFunction,
        isString = types.isString,
        isEmptyObject = types.isEmptyObject,
        mixin = objects.mixin,
        safeMixin = objects.safeMixin;

    function parse(event) {
        var segs = ("" + event).split(".");
        return {
            name: segs[0],
            ns: segs.slice(1).join(" ")
        };
    }

    
    var queues  = new Map();


    var Emitter = Listener.inherit({
        _prepareArgs : function(e,args) {
            if (isDefined(args)) {
                args = [e].concat(args);
            } else {
                args = [e];
            }
            return args;
        },

        on: function(events, selector, data, callback, ctx, /*used internally*/ one) {
            var self = this,
                _hub = this._hub || (this._hub = {});

            if (isPlainObject(events)) {
                ctx = callback;
                each(events, function(type, fn) {
                    self.on(type, selector, data, fn, ctx, one);
                });
                return this;
            }

            if (!isString(selector) && !isFunction(callback)) {
                ctx = callback;
                callback = data;
                data = selector;
                selector = undefined;
            }

            if (isFunction(data)) {
                ctx = callback;
                callback = data;
                data = null;
            }

            if (!callback ) {
                throw new Error("No callback function");
            } else if (!isFunction(callback)) {
                throw new Error("The callback  is not afunction");
            }

            if (isString(events)) {
                events = events.split(/\s/)
            }

            events.forEach(function(event) {
                var parsed = parse(event),
                    name = parsed.name,
                    ns = parsed.ns;

                (_hub[name] || (_hub[name] = [])).push({
                    fn: callback,
                    selector: selector,
                    data: data,
                    ctx: ctx,
                    ns : ns,
                    one: one
                });
            });

            return this;
        },

        one: function(events, selector, data, callback, ctx) {
            return this.on(events, selector, data, callback, ctx, 1);
        },

        emit: function(e /*,argument list*/ ) {
            if (!this._hub) {
                return this;
            }

            var self = this;

            if (isString(e)) {
                e = new Event(e); //new CustomEvent(e);
            }

            Object.defineProperty(e,"target",{
                value : this
            });

            var args = slice.call(arguments, 1);

            args = this._prepareArgs(e,args);

            [e.type || e.name, "all"].forEach(function(eventName) {
                var parsed = parse(eventName),
                    name = parsed.name,
                    ns = parsed.ns;

                var listeners = self._hub[name];
                if (!listeners) {
                    return;
                }

                var len = listeners.length,
                    reCompact = false;

                for (var i = 0; i < len; i++) {
                    if (e.isImmediatePropagationStopped && e.isImmediatePropagationStopped()) {
                        return this;
                    }
                    var listener = listeners[i];
                    if (ns && (!listener.ns ||  !listener.ns.startsWith(ns))) {
                        continue;
                    }

                    if (listener.data) {
                        e.data = mixin({}, listener.data, e.data);
                    }
                    if (args.length == 2 && isPlainObject(args[1])) {
                        e.data = e.data || {};
                        mixin(e.data,args[1]);
                    }

                    listener.fn.apply(listener.ctx, args);
                    if (listener.one) {
                        listeners[i] = null;
                        reCompact = true;
                    }
                }

                if (reCompact) {
                    self._hub[eventName] = compact(listeners);
                }

            });
            return this;
        },

        queueEmit : function (event) {
            const type = event.type || event;
            let map = queues.get(this);
            if (!map) {
                map = new Map();
                queues.set(this, map);
            }
            const oldTimeout = map.get(type);
            map.delete(type);
            window.clearTimeout(oldTimeout);
            const timeout = window.setTimeout(() => {
                if (map.size === 0) {
                    map = null;
                    queues.delete(this);
                }
                this.trigger(event);
            }, 0);
            map.set(type, timeout);
        },

        listened: function(event) {
            var evtArr = ((this._hub || (this._events = {}))[event] || []);
            return evtArr.length > 0;
        },

        off: function(events, callback) {
            if (!events) {
              this._hub = null;
              return;
            }
            var _hub = this._hub || (this._hub = {});
            if (isString(events)) {
                events = events.split(/\s/)
            }

            events.forEach(function(event) {
                var parsed = parse(event),
                    name = parsed.name,
                    ns = parsed.ns;

                var evts = _hub[name];

                if (evts) {
                    var liveEvents = [];

                    if (callback || ns) {
                        for (var i = 0, len = evts.length; i < len; i++) {
                            
                            if (callback && evts[i].fn !== callback && evts[i].fn._ !== callback) {
                                liveEvents.push(evts[i]);
                                continue;
                            } 

                            if (ns && (!evts[i].ns || evts[i].ns.indexOf(ns)!=0)) {
                                liveEvents.push(evts[i]);
                                continue;
                            }
                        }
                    }

                    if (liveEvents.length) {
                        _hub[name] = liveEvents;
                    } else {
                        delete _hub[name];
                    }

                }
            });

            return this;
        },

        trigger  : function() {
            return this.emit.apply(this,arguments);
        },

        queueTrigger : function (event) {
            return this.queueEmit.apply(this,arguments);
        }

    });


    return events.Emitter = Emitter;

});
define('skylark-langx-events/create-event',[
	"./events",
	"./event"
],function(events,Event){
    function createEvent(type,props) {
        //var e = new CustomEvent(type,props);
        //return safeMixin(e, props);
        return new Event(type,props);
    };

    return events.createEvent = createEvent;	
});
define('skylark-langx-events/main',[
	"./events",
	"./event",
	"./listener",
	"./emitter",
	"./create-event"
],function(events){
	return events;
});
define('skylark-langx-events', ['skylark-langx-events/main'], function (main) { return main; });

define('skylark-io-readers/_reader',[
    "skylark-langx-events",
    "skylark-langx-binary/transform",
    "./readers"
], function(events,transform,readers) {

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
            return transform('string', this.readData(size));
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
define('skylark-jszip/reader/ArrayReader',[
    "skylark-io-readers/array-reader"
], function (ArrayReader) {
    'use strict';

    return ArrayReader;

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
define('skylark-jszip/reader/StringReader',[
    "skylark-io-readers/string-reader"
], function (StringReader) {
    'use strict';

    return StringReader;

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
define('skylark-jszip/reader/NodeBufferReader',[
    "skylark-io-readers/buffer-reader"
], function (BufferReader) {
    'use strict';

    return BufferReader;

});
define('skylark-jszip/reader/Uint8ArrayReader',[
    "skylark-io-readers/uint8-array-reader"
], function (Uint8ArrayReader) {
    'use strict';

    return Uint8ArrayReader;

});
define('skylark-jszip/reader/readerFor',[
    '../utils',
    '../support',
    './ArrayReader',
    './StringReader',
    './NodeBufferReader',
    './Uint8ArrayReader'
], function (utils, support, ArrayReader, StringReader, NodeBufferReader, Uint8ArrayReader) {
    'use strict';

    function readerFor(data) {
        var type = utils.getTypeOf(data);
        utils.checkSupport(type);
        if (type === 'string' && !support.uint8array) {
            return new StringReader(data);
        }
        if (type === 'nodebuffer') {
            return new NodeBufferReader(data);
        }
        if (support.uint8array) {
            return new Uint8ArrayReader(utils.transformTo('uint8array', data));
        }
        return new ArrayReader(utils.transformTo('array', data));
    }

    return readerFor;
});
define('skylark-jszip/zipEntry',[
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
define('skylark-jszip/zipEntries',[
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
define('skylark-jszip/load',[
    './utils',
    './external',
    './utf8',
    './zipEntries',
    './stream/Crc32Probe'
], function (utils, external, utf8, ZipEntries, Crc32Probe) {
    'use strict';

    function checkEntryCRC32(zipEntry) {
        return new external.Promise(function (resolve, reject) {
            var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
            worker.on('error', function (e) {
                reject(e);
            }).on('end', function () {
                if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) {
                    reject(new Error('Corrupted zip : CRC32 mismatch'));
                } else {
                    resolve();
                }
            }).resume();
        });
    }
    function load(data, options) {
        var zip = this;
        options = utils.extend(options || {}, {
            base64: false,
            checkCRC32: false,
            optimizedBinaryString: false,
            createFolders: false,
            decodeFileName: utf8.utf8decode
        });
        ///if (nodejsUtils.isNode && nodejsUtils.isStream(data)) {
        ///    return external.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file."));
        ///}
        return utils.prepareContent('the loaded zip file', data, true, options.optimizedBinaryString, options.base64).then(function (data) {
            var zipEntries = new ZipEntries(options);
            zipEntries.load(data);
            return zipEntries;
        }).then(function checkCRC32(zipEntries) {
            var promises = [external.Promise.resolve(zipEntries)];
            var files = zipEntries.files;
            if (options.checkCRC32) {
                for (var i = 0; i < files.length; i++) {
                    promises.push(checkEntryCRC32(files[i]));
                }
            }
            return external.Promise.all(promises);
        }).then(function addFiles(results) {
            var zipEntries = results.shift();
            var files = zipEntries.files;
            for (var i = 0; i < files.length; i++) {
                var input = files[i];
                var unsafeName = input.fileNameStr;
                var safeName = utils.resolve(input.fileNameStr);
                zip.file(safeName, input.decompressed, {
                    binary: true,
                    optimizedBinaryString: true,
                    date: input.date,
                    dir: input.dir,
                    comment: input.fileCommentStr.length ? input.fileCommentStr : null,
                    unixPermissions: input.unixPermissions,
                    dosPermissions: input.dosPermissions,
                    createFolders: options.createFolders
                });
                if (!input.dir) {
                    zip.file(safeName).unsafeOriginalName = unsafeName;
                }
            }
            if (zipEntries.zipComment.length) {
                zip.comment = zipEntries.zipComment;
            }
            return zip;
        });
    };

    return load;
});
define('skylark-jszip/JSZip',[
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
define('skylark-jszip/main',[
    "skylark-langx-ns",
    "./JSZip"
], function(skylark, JSZip) {

    var zip = function(data, options) {
        var zip =  new JSZip();
        if (arguments.length>0) {
        	return zip.loadAsync(data, options);
        } else {
        	return zip;
        }
    };

    zip.ZipFile = JSZip

    return skylark.attach("intg.jszip", zip);

});
define('skylark-jszip', ['skylark-jszip/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-jszip-all.js.map
