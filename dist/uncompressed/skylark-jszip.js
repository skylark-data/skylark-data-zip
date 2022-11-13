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

define('skylark-langx-binary/Buffer',[
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


  Buffer.INSPECT_MAX_BYTES = 50

  var K_MAX_LENGTH = 0x7fffffff
  Buffer.kMaxLength = K_MAX_LENGTH

  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
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
  Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

  if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
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

  Object.defineProperty(Buffer.prototype, 'parent', {
    get: function () {
      if (!(this instanceof Buffer)) {
        return undefined
      }
      return this.buffer
    }
  })

  Object.defineProperty(Buffer.prototype, 'offset', {
    get: function () {
      if (!(this instanceof Buffer)) {
        return undefined
      }
      return this.byteOffset
    }
  })

  function createBuffer (length) {
    if (length > K_MAX_LENGTH) {
      throw new RangeError('Invalid typed array length')
    }
    // Return an augmented `Uint8Array` instance
    var buf = new Uint8Array(length)
    buf.__proto__ = Buffer.prototype
    return buf
  }

  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */

  function Buffer (arg, encodingOrOffset, length) {
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
      Buffer[Symbol.species] === Buffer) {
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true,
      enumerable: false,
      writable: false
    })
  }

  Buffer.poolSize = 8192 // not used by this implementation

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
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/
  Buffer.from = function (value, encodingOrOffset, length) {
    return from(value, encodingOrOffset, length)
  }

  // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
  // https://github.com/feross/buffer/pull/148
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array

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
      return createBuffer(size)
    }
    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string'
        ? createBuffer(size).fill(fill, encoding)
        : createBuffer(size).fill(fill)
    }
    return createBuffer(size)
  }

  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/
  Buffer.alloc = function (size, fill, encoding) {
    return alloc(size, fill, encoding)
  }

  function allocUnsafe (size) {
    assertSize(size)
    return createBuffer(size < 0 ? 0 : checked(size) | 0)
  }

  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */
  Buffer.allocUnsafe = function (size) {
    return allocUnsafe(size)
  }
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */
  Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(size)
  }

  function fromString (string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8'
    }

    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }

    var length = byteLength(string, encoding) | 0
    var buf = createBuffer(length)

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
    var buf = createBuffer(length)
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
    buf.__proto__ = Buffer.prototype
    return buf
  }

  function fromObject (obj) {
    if (Buffer.isBuffer(obj)) {
      var len = checked(obj.length) | 0
      var buf = createBuffer(len)

      if (buf.length === 0) {
        return buf
      }

      obj.copy(buf, 0, 0, len)
      return buf
    }

    if (obj) {
      if (ArrayBuffer.isView(obj) || 'length' in obj) {
        if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
          return createBuffer(0)
        }
        return fromArrayLike(obj)
      }

      if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data)
      }
    }

    throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.')
  }

  function checked (length) {
    // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= K_MAX_LENGTH) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                           'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
    }
    return length | 0
  }

  function SlowBuffer (length) {
    if (+length != length) { // eslint-disable-line eqeqeq
      length = 0
    }
    return Buffer.alloc(+length)
  }

  Buffer.isBuffer = function isBuffer (b) {
    return b != null && b._isBuffer === true
  }

  Buffer.compare = function compare (a, b) {
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
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

  Buffer.isEncoding = function isEncoding (encoding) {
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

  Buffer.concat = function concat (list, length) {
    if (!Array.isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }

    if (list.length === 0) {
      return Buffer.alloc(0)
    }

    var i
    if (length === undefined) {
      length = 0
      for (i = 0; i < list.length; ++i) {
        length += list[i].length
      }
    }

    var buffer = Buffer.allocUnsafe(length)
    var pos = 0
    for (i = 0; i < list.length; ++i) {
      var buf = list[i]
      if (ArrayBuffer.isView(buf)) {
        buf = Buffer.from(buf)
      }
      if (!Buffer.isBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }
      buf.copy(buffer, pos)
      pos += buf.length
    }
    return buffer
  }

  function byteLength (string, encoding) {
    if (Buffer.isBuffer(string)) {
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
  Buffer.byteLength = byteLength

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

  // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
  // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
  // reliably in a browserify context because there could be multiple different
  // copies of the 'buffer' package in use. This method works even for Buffer
  // instances that were created from another copy of the `buffer` package.
  // See: https://github.com/feross/buffer/issues/154
  Buffer.prototype._isBuffer = true

  function swap (b, n, m) {
    var i = b[n]
    b[n] = b[m]
    b[m] = i
  }

  Buffer.prototype.swap16 = function swap16 () {
    var len = this.length
    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits')
    }
    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1)
    }
    return this
  }

  Buffer.prototype.swap32 = function swap32 () {
    var len = this.length
    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits')
    }
    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3)
      swap(this, i + 1, i + 2)
    }
    return this
  }

  Buffer.prototype.swap64 = function swap64 () {
    var len = this.length
    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits')
    }
    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7)
      swap(this, i + 1, i + 6)
      swap(this, i + 2, i + 5)
      swap(this, i + 3, i + 4)
    }
    return this
  }

  Buffer.prototype.toString = function toString () {
    var length = this.length
    if (length === 0) return ''
    if (arguments.length === 0) return utf8Slice(this, 0, length)
    return slowToString.apply(this, arguments)
  }

  Buffer.prototype.toLocaleString = Buffer.prototype.toString

  Buffer.prototype.equals = function equals (b) {
    if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
    if (this === b) return true
    return Buffer.compare(this, b) === 0
  }

  Buffer.prototype.inspect = function inspect () {
    var str = ''
    var max = Buffer.INSPECT_MAX_BYTES
    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
      if (this.length > max) str += ' ... '
    }
    return '<Buffer ' + str + '>'
  }

  Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
    if (!Buffer.isBuffer(target)) {
      throw new TypeError('Argument must be a Buffer')
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
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
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
      val = Buffer.from(val, encoding)
    }

    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (Buffer.isBuffer(val)) {
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

    throw new TypeError('val must be string, number or Buffer')
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

  Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1
  }

  Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
  }

  Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
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

  Buffer.prototype.write = function write (string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8'
      length = this.length
      offset = 0
    // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset
      length = this.length
      offset = 0
    // Buffer#write(string, offset[, length][, encoding])
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
        'Buffer.write(string, encoding, offset[, length]) is no longer supported'
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

  Buffer.prototype.toJSON = function toJSON () {
    return {
      type: 'Buffer',
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

  Buffer.prototype.slice = function slice (start, end) {
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
    newBuf.__proto__ = Buffer.prototype
    return newBuf
  }

  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */
  function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
  }

  Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
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

  Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
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

  Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 1, this.length)
    return this[offset]
  }

  Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    return this[offset] | (this[offset + 1] << 8)
  }

  Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    return (this[offset] << 8) | this[offset + 1]
  }

  Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
  }

  Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
  }

  Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
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

  Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
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

  Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 1, this.length)
    if (!(this[offset] & 0x80)) return (this[offset])
    return ((0xff - this[offset] + 1) * -1)
  }

  Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    var val = this[offset] | (this[offset + 1] << 8)
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  }

  Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    var val = this[offset + 1] | (this[offset] << 8)
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  }

  Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
  }

  Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
  }

  Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)
    return ieee754.read(this, offset, true, 23, 4)
  }

  Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)
    return ieee754.read(this, offset, false, 23, 4)
  }

  Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 8, this.length)
    return ieee754.read(this, offset, true, 52, 8)
  }

  Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 8, this.length)
    return ieee754.read(this, offset, false, 52, 8)
  }

  function checkInt (buf, value, offset, ext, max, min) {
    if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
  }

  Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
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

  Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
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

  Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
    this[offset] = (value & 0xff)
    return offset + 1
  }

  Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    return offset + 2
  }

  Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
    return offset + 2
  }

  Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
    return offset + 4
  }

  Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
    return offset + 4
  }

  Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
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

  Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
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

  Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
    if (value < 0) value = 0xff + value + 1
    this[offset] = (value & 0xff)
    return offset + 1
  }

  Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    return offset + 2
  }

  Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
    return offset + 2
  }

  Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
    return offset + 4
  }

  Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
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

  Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert)
  }

  Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
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

  Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert)
  }

  Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert)
  }

  // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
  Buffer.prototype.copy = function copy (target, targetStart, start, end) {
    if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
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
  Buffer.prototype.fill = function fill (val, start, end, encoding) {
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
      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
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
      var bytes = Buffer.isBuffer(val)
        ? val
        : new Buffer(val, encoding)
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

  return binary.Buffer = Buffer;

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
    './support',
    './base64',
    './external',
], function (Buffer,support, base64, external) {
    'use strict';
    var utils = {};

    function string2binary(str) {
        var result = null;
        if (support.uint8array) {
            result = new Uint8Array(str.length);
        } else {
            result = new Array(str.length);
        }
        return stringToArrayLike(str, result);
    }
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
    function identity(input) {
        return input;
    }
    function stringToArrayLike(str, array) {
        for (var i = 0; i < str.length; ++i) {
            array[i] = str.charCodeAt(i) & 255;
        }
        return array;
    }
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
        var chunk = 65536, type = utils.getTypeOf(array), canUseApply = true;
        if (type === 'uint8array') {
            canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
        } else if (type === 'nodebuffer') {
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
    utils.applyFromCharCode = arrayLikeToString;
    function arrayLikeToArrayLike(arrayFrom, arrayTo) {
        for (var i = 0; i < arrayFrom.length; i++) {
            arrayTo[i] = arrayFrom[i];
        }
        return arrayTo;
    }
    var transform = {};
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
        'nodebuffer': function (input) {
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
        'nodebuffer': function (input) {
            ///return nodejsUtils.newBufferFrom(input);
            return Buffer.from(input);
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
        'nodebuffer': function (input) {
            ///return nodejsUtils.newBufferFrom(new Uint8Array(input));
            return Buffer.from(new Uint8Array(input));
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
        'nodebuffer': function (input) {
            ///return nodejsUtils.newBufferFrom(input);
            return Buffer.from(input);
        }
    };
    transform['nodebuffer'] = {
        'string': arrayLikeToString,
        'array': function (input) {
            return arrayLikeToArrayLike(input, new Array(input.length));
        },
        'arraybuffer': function (input) {
            return transform['nodebuffer']['uint8array'](input).buffer;
        },
        'uint8array': function (input) {
            return arrayLikeToArrayLike(input, new Uint8Array(input.length));
        },
        'nodebuffer': identity
    };
    utils.transformTo = function (outputType, input) {
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
define('skylark-jszip/reader/DataReader',['../utils'], function (utils) {
    'use strict';

    function DataReader(data) {
        this.data = data;
        this.length = data.length;
        this.index = 0;
        this.zero = 0;
    }
    DataReader.prototype = {
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
    };
    return DataReader;
});
define('skylark-jszip/reader/ArrayReader',[
    './DataReader',
    '../utils'
], function (DataReader, utils) {
    'use strict';

    function ArrayReader(data) {
        DataReader.call(this, data);
        for (var i = 0; i < this.data.length; i++) {
            data[i] = data[i] & 255;
        }
    }
    utils.inherits(ArrayReader, DataReader);
    ArrayReader.prototype.byteAt = function (i) {
        return this.data[this.zero + i];
    };
    ArrayReader.prototype.lastIndexOfSignature = function (sig) {
        var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3);
        for (var i = this.length - 4; i >= 0; --i) {
            if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
                return i - this.zero;
            }
        }
        return -1;
    };
    ArrayReader.prototype.readAndCheckSignature = function (sig) {
        var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3), data = this.readData(4);
        return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
    };
    ArrayReader.prototype.readData = function (size) {
        this.checkOffset(size);
        if (size === 0) {
            return [];
        }
        var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };


    return ArrayReader;

});
define('skylark-jszip/reader/StringReader',[
    './DataReader',
    '../utils'
], function (DataReader, utils) {
    'use strict';

    function StringReader(data) {
        DataReader.call(this, data);
    }
    utils.inherits(StringReader, DataReader);
    StringReader.prototype.byteAt = function (i) {
        return this.data.charCodeAt(this.zero + i);
    };
    StringReader.prototype.lastIndexOfSignature = function (sig) {
        return this.data.lastIndexOf(sig) - this.zero;
    };
    StringReader.prototype.readAndCheckSignature = function (sig) {
        var data = this.readData(4);
        return sig === data;
    };
    StringReader.prototype.readData = function (size) {
        this.checkOffset(size);
        var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };
    
    return StringReader;
});
define('skylark-jszip/reader/Uint8ArrayReader',[
    './ArrayReader',
    '../utils'
], function (ArrayReader, utils) {
    'use strict';

    function Uint8ArrayReader(data) {
        ArrayReader.call(this, data);
    }
    utils.inherits(Uint8ArrayReader, ArrayReader);
    Uint8ArrayReader.prototype.readData = function (size) {
        this.checkOffset(size);
        if (size === 0) {
            return new Uint8Array(0);
        }
        var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };
    return Uint8ArrayReader;

});
define('skylark-jszip/reader/NodeBufferReader',[
    './Uint8ArrayReader',
    '../utils'
], function (Uint8ArrayReader, utils) {
    'use strict';

    function NodeBufferReader(data) {
        Uint8ArrayReader.call(this, data);
    }
    utils.inherits(NodeBufferReader, Uint8ArrayReader);
    NodeBufferReader.prototype.readData = function (size) {
        this.checkOffset(size);
        var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
        this.index += size;
        return result;
    };
    return NodeBufferReader;
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
//# sourceMappingURL=sourcemaps/skylark-jszip.js.map
