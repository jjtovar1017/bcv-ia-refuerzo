/**
 * @licstart The following is the entire license notice for the
 * JavaScript code in this page
 *
 * Copyright 2024 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @licend The above is the entire license notice for the
 * JavaScript code in this page
 */

/******/ var __webpack_modules__ = ({

/***/ 9306:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var isCallable = __webpack_require__(4901);
var tryToString = __webpack_require__(6823);

var $TypeError = TypeError;

// `Assert: IsCallable(argument) is true`
module.exports = function (argument) {
  if (isCallable(argument)) return argument;
  throw new $TypeError(tryToString(argument) + ' is not a function');
};


/***/ }),

/***/ 3506:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var isPossiblePrototype = __webpack_require__(3925);

var $String = String;
var $TypeError = TypeError;

module.exports = function (argument) {
  if (isPossiblePrototype(argument)) return argument;
  throw new $TypeError("Can't set " + $String(argument) + ' as a prototype');
};


/***/ }),

/***/ 7080:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var has = (__webpack_require__(4402).has);

// Perform ? RequireInternalSlot(M, [[SetData]])
module.exports = function (it) {
  has(it);
  return it;
};


/***/ }),

/***/ 679:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var isPrototypeOf = __webpack_require__(1625);

var $TypeError = TypeError;

module.exports = function (it, Prototype) {
  if (isPrototypeOf(Prototype, it)) return it;
  throw new $TypeError('Incorrect invocation');
};


/***/ }),

/***/ 8551:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var isObject = __webpack_require__(34);

var $String = String;
var $TypeError = TypeError;

// `Assert: Type(argument) is Object`
module.exports = function (argument) {
  if (isObject(argument)) return argument;
  throw new $TypeError($String(argument) + ' is not an object');
};


/***/ }),

/***/ 7811:
/***/ ((module) => {


// eslint-disable-next-line es/no-typed-arrays -- safe
module.exports = typeof ArrayBuffer != 'undefined' && typeof DataView != 'undefined';


/***/ }),

/***/ 7394:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);
var uncurryThisAccessor = __webpack_require__(6706);
var classof = __webpack_require__(2195);

var ArrayBuffer = globalThis.ArrayBuffer;
var TypeError = globalThis.TypeError;

// Includes
// - Perform ? RequireInternalSlot(O, [[ArrayBufferData]]).
// - If IsSharedArrayBuffer(O) is true, throw a TypeError exception.
module.exports = ArrayBuffer && uncurryThisAccessor(ArrayBuffer.prototype, 'byteLength', 'get') || function (O) {
  if (classof(O) !== 'ArrayBuffer') throw new TypeError('ArrayBuffer expected');
  return O.byteLength;
};


/***/ }),

/***/ 3238:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);
var uncurryThis = __webpack_require__(7476);
var arrayBufferByteLength = __webpack_require__(7394);

var ArrayBuffer = globalThis.ArrayBuffer;
var ArrayBufferPrototype = ArrayBuffer && ArrayBuffer.prototype;
var slice = ArrayBufferPrototype && uncurryThis(ArrayBufferPrototype.slice);

module.exports = function (O) {
  if (arrayBufferByteLength(O) !== 0) return false;
  if (!slice) return false;
  try {
    slice(O, 0, 0);
    return false;
  } catch (error) {
    return true;
  }
};


/***/ }),

/***/ 5169:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var isDetached = __webpack_require__(3238);

var $TypeError = TypeError;

module.exports = function (it) {
  if (isDetached(it)) throw new $TypeError('ArrayBuffer is detached');
  return it;
};


/***/ }),

/***/ 5636:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);
var uncurryThis = __webpack_require__(9504);
var uncurryThisAccessor = __webpack_require__(6706);
var toIndex = __webpack_require__(7696);
var notDetached = __webpack_require__(5169);
var arrayBufferByteLength = __webpack_require__(7394);
var detachTransferable = __webpack_require__(4483);
var PROPER_STRUCTURED_CLONE_TRANSFER = __webpack_require__(1548);

var structuredClone = globalThis.structuredClone;
var ArrayBuffer = globalThis.ArrayBuffer;
var DataView = globalThis.DataView;
var min = Math.min;
var ArrayBufferPrototype = ArrayBuffer.prototype;
var DataViewPrototype = DataView.prototype;
var slice = uncurryThis(ArrayBufferPrototype.slice);
var isResizable = uncurryThisAccessor(ArrayBufferPrototype, 'resizable', 'get');
var maxByteLength = uncurryThisAccessor(ArrayBufferPrototype, 'maxByteLength', 'get');
var getInt8 = uncurryThis(DataViewPrototype.getInt8);
var setInt8 = uncurryThis(DataViewPrototype.setInt8);

module.exports = (PROPER_STRUCTURED_CLONE_TRANSFER || detachTransferable) && function (arrayBuffer, newLength, preserveResizability) {
  var byteLength = arrayBufferByteLength(arrayBuffer);
  var newByteLength = newLength === undefined ? byteLength : toIndex(newLength);
  var fixedLength = !isResizable || !isResizable(arrayBuffer);
  var newBuffer;
  notDetached(arrayBuffer);
  if (PROPER_STRUCTURED_CLONE_TRANSFER) {
    arrayBuffer = structuredClone(arrayBuffer, { transfer: [arrayBuffer] });
    if (byteLength === newByteLength && (preserveResizability || fixedLength)) return arrayBuffer;
  }
  if (byteLength >= newByteLength && (!preserveResizability || fixedLength)) {
    newBuffer = slice(arrayBuffer, 0, newByteLength);
  } else {
    var options = preserveResizability && !fixedLength && maxByteLength ? { maxByteLength: maxByteLength(arrayBuffer) } : undefined;
    newBuffer = new ArrayBuffer(newByteLength, options);
    var a = new DataView(arrayBuffer);
    var b = new DataView(newBuffer);
    var copyLength = min(newByteLength, byteLength);
    for (var i = 0; i < copyLength; i++) setInt8(b, i, getInt8(a, i));
  }
  if (!PROPER_STRUCTURED_CLONE_TRANSFER) detachTransferable(arrayBuffer);
  return newBuffer;
};


/***/ }),

/***/ 4644:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var NATIVE_ARRAY_BUFFER = __webpack_require__(7811);
var DESCRIPTORS = __webpack_require__(3724);
var globalThis = __webpack_require__(4576);
var isCallable = __webpack_require__(4901);
var isObject = __webpack_require__(34);
var hasOwn = __webpack_require__(9297);
var classof = __webpack_require__(6955);
var tryToString = __webpack_require__(6823);
var createNonEnumerableProperty = __webpack_require__(6699);
var defineBuiltIn = __webpack_require__(6840);
var defineBuiltInAccessor = __webpack_require__(2106);
var isPrototypeOf = __webpack_require__(1625);
var getPrototypeOf = __webpack_require__(2787);
var setPrototypeOf = __webpack_require__(2967);
var wellKnownSymbol = __webpack_require__(8227);
var uid = __webpack_require__(3392);
var InternalStateModule = __webpack_require__(1181);

var enforceInternalState = InternalStateModule.enforce;
var getInternalState = InternalStateModule.get;
var Int8Array = globalThis.Int8Array;
var Int8ArrayPrototype = Int8Array && Int8Array.prototype;
var Uint8ClampedArray = globalThis.Uint8ClampedArray;
var Uint8ClampedArrayPrototype = Uint8ClampedArray && Uint8ClampedArray.prototype;
var TypedArray = Int8Array && getPrototypeOf(Int8Array);
var TypedArrayPrototype = Int8ArrayPrototype && getPrototypeOf(Int8ArrayPrototype);
var ObjectPrototype = Object.prototype;
var TypeError = globalThis.TypeError;

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var TYPED_ARRAY_TAG = uid('TYPED_ARRAY_TAG');
var TYPED_ARRAY_CONSTRUCTOR = 'TypedArrayConstructor';
// Fixing native typed arrays in Opera Presto crashes the browser, see #595
var NATIVE_ARRAY_BUFFER_VIEWS = NATIVE_ARRAY_BUFFER && !!setPrototypeOf && classof(globalThis.opera) !== 'Opera';
var TYPED_ARRAY_TAG_REQUIRED = false;
var NAME, Constructor, Prototype;

var TypedArrayConstructorsList = {
  Int8Array: 1,
  Uint8Array: 1,
  Uint8ClampedArray: 1,
  Int16Array: 2,
  Uint16Array: 2,
  Int32Array: 4,
  Uint32Array: 4,
  Float32Array: 4,
  Float64Array: 8
};

var BigIntArrayConstructorsList = {
  BigInt64Array: 8,
  BigUint64Array: 8
};

var isView = function isView(it) {
  if (!isObject(it)) return false;
  var klass = classof(it);
  return klass === 'DataView'
    || hasOwn(TypedArrayConstructorsList, klass)
    || hasOwn(BigIntArrayConstructorsList, klass);
};

var getTypedArrayConstructor = function (it) {
  var proto = getPrototypeOf(it);
  if (!isObject(proto)) return;
  var state = getInternalState(proto);
  return (state && hasOwn(state, TYPED_ARRAY_CONSTRUCTOR)) ? state[TYPED_ARRAY_CONSTRUCTOR] : getTypedArrayConstructor(proto);
};

var isTypedArray = function (it) {
  if (!isObject(it)) return false;
  var klass = classof(it);
  return hasOwn(TypedArrayConstructorsList, klass)
    || hasOwn(BigIntArrayConstructorsList, klass);
};

var aTypedArray = function (it) {
  if (isTypedArray(it)) return it;
  throw new TypeError('Target is not a typed array');
};

var aTypedArrayConstructor = function (C) {
  if (isCallable(C) && (!setPrototypeOf || isPrototypeOf(TypedArray, C))) return C;
  throw new TypeError(tryToString(C) + ' is not a typed array constructor');
};

var exportTypedArrayMethod = function (KEY, property, forced, options) {
  if (!DESCRIPTORS) return;
  if (forced) for (var ARRAY in TypedArrayConstructorsList) {
    var TypedArrayConstructor = globalThis[ARRAY];
    if (TypedArrayConstructor && hasOwn(TypedArrayConstructor.prototype, KEY)) try {
      delete TypedArrayConstructor.prototype[KEY];
    } catch (error) {
      // old WebKit bug - some methods are non-configurable
      try {
        TypedArrayConstructor.prototype[KEY] = property;
      } catch (error2) { /* empty */ }
    }
  }
  if (!TypedArrayPrototype[KEY] || forced) {
    defineBuiltIn(TypedArrayPrototype, KEY, forced ? property
      : NATIVE_ARRAY_BUFFER_VIEWS && Int8ArrayPrototype[KEY] || property, options);
  }
};

var exportTypedArrayStaticMethod = function (KEY, property, forced) {
  var ARRAY, TypedArrayConstructor;
  if (!DESCRIPTORS) return;
  if (setPrototypeOf) {
    if (forced) for (ARRAY in TypedArrayConstructorsList) {
      TypedArrayConstructor = globalThis[ARRAY];
      if (TypedArrayConstructor && hasOwn(TypedArrayConstructor, KEY)) try {
        delete TypedArrayConstructor[KEY];
      } catch (error) { /* empty */ }
    }
    if (!TypedArray[KEY] || forced) {
      // V8 ~ Chrome 49-50 `%TypedArray%` methods are non-writable non-configurable
      try {
        return defineBuiltIn(TypedArray, KEY, forced ? property : NATIVE_ARRAY_BUFFER_VIEWS && TypedArray[KEY] || property);
      } catch (error) { /* empty */ }
    } else return;
  }
  for (ARRAY in TypedArrayConstructorsList) {
    TypedArrayConstructor = globalThis[ARRAY];
    if (TypedArrayConstructor && (!TypedArrayConstructor[KEY] || forced)) {
      defineBuiltIn(TypedArrayConstructor, KEY, property);
    }
  }
};

for (NAME in TypedArrayConstructorsList) {
  Constructor = globalThis[NAME];
  Prototype = Constructor && Constructor.prototype;
  if (Prototype) enforceInternalState(Prototype)[TYPED_ARRAY_CONSTRUCTOR] = Constructor;
  else NATIVE_ARRAY_BUFFER_VIEWS = false;
}

for (NAME in BigIntArrayConstructorsList) {
  Constructor = globalThis[NAME];
  Prototype = Constructor && Constructor.prototype;
  if (Prototype) enforceInternalState(Prototype)[TYPED_ARRAY_CONSTRUCTOR] = Constructor;
}

// WebKit bug - typed arrays constructors prototype is Object.prototype
if (!NATIVE_ARRAY_BUFFER_VIEWS || !isCallable(TypedArray) || TypedArray === Function.prototype) {
  // eslint-disable-next-line no-shadow -- safe
  TypedArray = function TypedArray() {
    throw new TypeError('Incorrect invocation');
  };
  if (NATIVE_ARRAY_BUFFER_VIEWS) for (NAME in TypedArrayConstructorsList) {
    if (globalThis[NAME]) setPrototypeOf(globalThis[NAME], TypedArray);
  }
}

if (!NATIVE_ARRAY_BUFFER_VIEWS || !TypedArrayPrototype || TypedArrayPrototype === Object.prototype) {
  TypedArrayPrototype = TypedArray.prototype;
  if (NATIVE_ARRAY_BUFFER_VIEWS) for (NAME in TypedArrayConstructorsList) {
    if (globalThis[NAME]) setPrototypeOf(globalThis[NAME].prototype, TypedArrayPrototype);
  }
}

// WebKit bug - one more object in Uint8ClampedArray prototype chain
if (NATIVE_ARRAY_BUFFER_VIEWS && getPrototypeOf(Uint8ClampedArrayPrototype) !== TypedArrayPrototype) {
  setPrototypeOf(Uint8ClampedArrayPrototype, TypedArrayPrototype);
}

if (DESCRIPTORS && !hasOwn(TypedArrayPrototype, TO_STRING_TAG)) {
  TYPED_ARRAY_TAG_REQUIRED = true;
  defineBuiltInAccessor(TypedArrayPrototype, TO_STRING_TAG, {
    configurable: true,
    get: function () {
      return isObject(this) ? this[TYPED_ARRAY_TAG] : undefined;
    }
  });
  for (NAME in TypedArrayConstructorsList) if (globalThis[NAME]) {
    createNonEnumerableProperty(globalThis[NAME], TYPED_ARRAY_TAG, NAME);
  }
}

module.exports = {
  NATIVE_ARRAY_BUFFER_VIEWS: NATIVE_ARRAY_BUFFER_VIEWS,
  TYPED_ARRAY_TAG: TYPED_ARRAY_TAG_REQUIRED && TYPED_ARRAY_TAG,
  aTypedArray: aTypedArray,
  aTypedArrayConstructor: aTypedArrayConstructor,
  exportTypedArrayMethod: exportTypedArrayMethod,
  exportTypedArrayStaticMethod: exportTypedArrayStaticMethod,
  getTypedArrayConstructor: getTypedArrayConstructor,
  isView: isView,
  isTypedArray: isTypedArray,
  TypedArray: TypedArray,
  TypedArrayPrototype: TypedArrayPrototype
};


/***/ }),

/***/ 5370:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var lengthOfArrayLike = __webpack_require__(6198);

module.exports = function (Constructor, list, $length) {
  var index = 0;
  var length = arguments.length > 2 ? $length : lengthOfArrayLike(list);
  var result = new Constructor(length);
  while (length > index) result[index] = list[index++];
  return result;
};


/***/ }),

/***/ 9617:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var toIndexedObject = __webpack_require__(5397);
var toAbsoluteIndex = __webpack_require__(5610);
var lengthOfArrayLike = __webpack_require__(6198);

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = lengthOfArrayLike(O);
    if (length === 0) return !IS_INCLUDES && -1;
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check
    if (IS_INCLUDES && el !== el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare -- NaN check
      if (value !== value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};


/***/ }),

/***/ 4527:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var DESCRIPTORS = __webpack_require__(3724);
var isArray = __webpack_require__(4376);

var $TypeError = TypeError;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Safari < 13 does not throw an error in this case
var SILENT_ON_NON_WRITABLE_LENGTH_SET = DESCRIPTORS && !function () {
  // makes no sense without proper strict mode support
  if (this !== undefined) return true;
  try {
    // eslint-disable-next-line es/no-object-defineproperty -- safe
    Object.defineProperty([], 'length', { writable: false }).length = 1;
  } catch (error) {
    return error instanceof TypeError;
  }
}();

module.exports = SILENT_ON_NON_WRITABLE_LENGTH_SET ? function (O, length) {
  if (isArray(O) && !getOwnPropertyDescriptor(O, 'length').writable) {
    throw new $TypeError('Cannot set read only .length');
  } return O.length = length;
} : function (O, length) {
  return O.length = length;
};


/***/ }),

/***/ 7680:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var uncurryThis = __webpack_require__(9504);

module.exports = uncurryThis([].slice);


/***/ }),

/***/ 7628:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var lengthOfArrayLike = __webpack_require__(6198);

// https://tc39.es/proposal-change-array-by-copy/#sec-array.prototype.toReversed
// https://tc39.es/proposal-change-array-by-copy/#sec-%typedarray%.prototype.toReversed
module.exports = function (O, C) {
  var len = lengthOfArrayLike(O);
  var A = new C(len);
  var k = 0;
  for (; k < len; k++) A[k] = O[len - k - 1];
  return A;
};


/***/ }),

/***/ 9928:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var lengthOfArrayLike = __webpack_require__(6198);
var toIntegerOrInfinity = __webpack_require__(1291);

var $RangeError = RangeError;

// https://tc39.es/proposal-change-array-by-copy/#sec-array.prototype.with
// https://tc39.es/proposal-change-array-by-copy/#sec-%typedarray%.prototype.with
module.exports = function (O, C, index, value) {
  var len = lengthOfArrayLike(O);
  var relativeIndex = toIntegerOrInfinity(index);
  var actualIndex = relativeIndex < 0 ? len + relativeIndex : relativeIndex;
  if (actualIndex >= len || actualIndex < 0) throw new $RangeError('Incorrect index');
  var A = new C(len);
  var k = 0;
  for (; k < len; k++) A[k] = k === actualIndex ? value : O[k];
  return A;
};


/***/ }),

/***/ 6319:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var anObject = __webpack_require__(8551);
var iteratorClose = __webpack_require__(9539);

// call something on iterator step with safe closing on error
module.exports = function (iterator, fn, value, ENTRIES) {
  try {
    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
  } catch (error) {
    iteratorClose(iterator, 'throw', error);
  }
};


/***/ }),

/***/ 2195:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var uncurryThis = __webpack_require__(9504);

var toString = uncurryThis({}.toString);
var stringSlice = uncurryThis(''.slice);

module.exports = function (it) {
  return stringSlice(toString(it), 8, -1);
};


/***/ }),

/***/ 6955:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var TO_STRING_TAG_SUPPORT = __webpack_require__(2140);
var isCallable = __webpack_require__(4901);
var classofRaw = __webpack_require__(2195);
var wellKnownSymbol = __webpack_require__(8227);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var $Object = Object;

// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) === 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
module.exports = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = $Object(it), TO_STRING_TAG)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) === 'Object' && isCallable(O.callee) ? 'Arguments' : result;
};


/***/ }),

/***/ 7740:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var hasOwn = __webpack_require__(9297);
var ownKeys = __webpack_require__(5031);
var getOwnPropertyDescriptorModule = __webpack_require__(7347);
var definePropertyModule = __webpack_require__(4913);

module.exports = function (target, source, exceptions) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!hasOwn(target, key) && !(exceptions && hasOwn(exceptions, key))) {
      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  }
};


/***/ }),

/***/ 2211:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var fails = __webpack_require__(9039);

module.exports = !fails(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  // eslint-disable-next-line es/no-object-getprototypeof -- required for testing
  return Object.getPrototypeOf(new F()) !== F.prototype;
});


/***/ }),

/***/ 2529:
/***/ ((module) => {


// `CreateIterResultObject` abstract operation
// https://tc39.es/ecma262/#sec-createiterresultobject
module.exports = function (value, done) {
  return { value: value, done: done };
};


/***/ }),

/***/ 6699:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var DESCRIPTORS = __webpack_require__(3724);
var definePropertyModule = __webpack_require__(4913);
var createPropertyDescriptor = __webpack_require__(6980);

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ }),

/***/ 6980:
/***/ ((module) => {


module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


/***/ }),

/***/ 4659:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var DESCRIPTORS = __webpack_require__(3724);
var definePropertyModule = __webpack_require__(4913);
var createPropertyDescriptor = __webpack_require__(6980);

module.exports = function (object, key, value) {
  if (DESCRIPTORS) definePropertyModule.f(object, key, createPropertyDescriptor(0, value));
  else object[key] = value;
};


/***/ }),

/***/ 2106:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var makeBuiltIn = __webpack_require__(283);
var defineProperty = __webpack_require__(4913);

module.exports = function (target, name, descriptor) {
  if (descriptor.get) makeBuiltIn(descriptor.get, name, { getter: true });
  if (descriptor.set) makeBuiltIn(descriptor.set, name, { setter: true });
  return defineProperty.f(target, name, descriptor);
};


/***/ }),

/***/ 6840:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var isCallable = __webpack_require__(4901);
var definePropertyModule = __webpack_require__(4913);
var makeBuiltIn = __webpack_require__(283);
var defineGlobalProperty = __webpack_require__(9433);

module.exports = function (O, key, value, options) {
  if (!options) options = {};
  var simple = options.enumerable;
  var name = options.name !== undefined ? options.name : key;
  if (isCallable(value)) makeBuiltIn(value, name, options);
  if (options.global) {
    if (simple) O[key] = value;
    else defineGlobalProperty(key, value);
  } else {
    try {
      if (!options.unsafe) delete O[key];
      else if (O[key]) simple = true;
    } catch (error) { /* empty */ }
    if (simple) O[key] = value;
    else definePropertyModule.f(O, key, {
      value: value,
      enumerable: false,
      configurable: !options.nonConfigurable,
      writable: !options.nonWritable
    });
  } return O;
};


/***/ }),

/***/ 6279:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var defineBuiltIn = __webpack_require__(6840);

module.exports = function (target, src, options) {
  for (var key in src) defineBuiltIn(target, key, src[key], options);
  return target;
};


/***/ }),

/***/ 9433:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);

// eslint-disable-next-line es/no-object-defineproperty -- safe
var defineProperty = Object.defineProperty;

module.exports = function (key, value) {
  try {
    defineProperty(globalThis, key, { value: value, configurable: true, writable: true });
  } catch (error) {
    globalThis[key] = value;
  } return value;
};


/***/ }),

/***/ 3724:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var fails = __webpack_require__(9039);

// Detect IE8's incomplete defineProperty implementation
module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] !== 7;
});


/***/ }),

/***/ 4483:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);
var getBuiltInNodeModule = __webpack_require__(9429);
var PROPER_STRUCTURED_CLONE_TRANSFER = __webpack_require__(1548);

var structuredClone = globalThis.structuredClone;
var $ArrayBuffer = globalThis.ArrayBuffer;
var $MessageChannel = globalThis.MessageChannel;
var detach = false;
var WorkerThreads, channel, buffer, $detach;

if (PROPER_STRUCTURED_CLONE_TRANSFER) {
  detach = function (transferable) {
    structuredClone(transferable, { transfer: [transferable] });
  };
} else if ($ArrayBuffer) try {
  if (!$MessageChannel) {
    WorkerThreads = getBuiltInNodeModule('worker_threads');
    if (WorkerThreads) $MessageChannel = WorkerThreads.MessageChannel;
  }

  if ($MessageChannel) {
    channel = new $MessageChannel();
    buffer = new $ArrayBuffer(2);

    $detach = function (transferable) {
      channel.port1.postMessage(null, [transferable]);
    };

    if (buffer.byteLength === 2) {
      $detach(buffer);
      if (buffer.byteLength === 0) detach = $detach;
    }
  }
} catch (error) { /* empty */ }

module.exports = detach;


/***/ }),

/***/ 4055:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);
var isObject = __webpack_require__(34);

var document = globalThis.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};


/***/ }),

/***/ 6837:
/***/ ((module) => {


var $TypeError = TypeError;
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF; // 2 ** 53 - 1 == 9007199254740991

module.exports = function (it) {
  if (it > MAX_SAFE_INTEGER) throw $TypeError('Maximum allowed index exceeded');
  return it;
};


/***/ }),

/***/ 5002:
/***/ ((module) => {


module.exports = {
  IndexSizeError: { s: 'INDEX_SIZE_ERR', c: 1, m: 1 },
  DOMStringSizeError: { s: 'DOMSTRING_SIZE_ERR', c: 2, m: 0 },
  HierarchyRequestError: { s: 'HIERARCHY_REQUEST_ERR', c: 3, m: 1 },
  WrongDocumentError: { s: 'WRONG_DOCUMENT_ERR', c: 4, m: 1 },
  InvalidCharacterError: { s: 'INVALID_CHARACTER_ERR', c: 5, m: 1 },
  NoDataAllowedError: { s: 'NO_DATA_ALLOWED_ERR', c: 6, m: 0 },
  NoModificationAllowedError: { s: 'NO_MODIFICATION_ALLOWED_ERR', c: 7, m: 1 },
  NotFoundError: { s: 'NOT_FOUND_ERR', c: 8, m: 1 },
  NotSupportedError: { s: 'NOT_SUPPORTED_ERR', c: 9, m: 1 },
  InUseAttributeError: { s: 'INUSE_ATTRIBUTE_ERR', c: 10, m: 1 },
  InvalidStateError: { s: 'INVALID_STATE_ERR', c: 11, m: 1 },
  SyntaxError: { s: 'SYNTAX_ERR', c: 12, m: 1 },
  InvalidModificationError: { s: 'INVALID_MODIFICATION_ERR', c: 13, m: 1 },
  NamespaceError: { s: 'NAMESPACE_ERR', c: 14, m: 1 },
  InvalidAccessError: { s: 'INVALID_ACCESS_ERR', c: 15, m: 1 },
  ValidationError: { s: 'VALIDATION_ERR', c: 16, m: 0 },
  TypeMismatchError: { s: 'TYPE_MISMATCH_ERR', c: 17, m: 1 },
  SecurityError: { s: 'SECURITY_ERR', c: 18, m: 1 },
  NetworkError: { s: 'NETWORK_ERR', c: 19, m: 1 },
  AbortError: { s: 'ABORT_ERR', c: 20, m: 1 },
  URLMismatchError: { s: 'URL_MISMATCH_ERR', c: 21, m: 1 },
  QuotaExceededError: { s: 'QUOTA_EXCEEDED_ERR', c: 22, m: 1 },
  TimeoutError: { s: 'TIMEOUT_ERR', c: 23, m: 1 },
  InvalidNodeTypeError: { s: 'INVALID_NODE_TYPE_ERR', c: 24, m: 1 },
  DataCloneError: { s: 'DATA_CLONE_ERR', c: 25, m: 1 }
};


/***/ }),

/***/ 8727:
/***/ ((module) => {


// IE8- don't enum bug keys
module.exports = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/***/ }),

/***/ 6193:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var ENVIRONMENT = __webpack_require__(4215);

module.exports = ENVIRONMENT === 'NODE';


/***/ }),

/***/ 2839:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);

var navigator = globalThis.navigator;
var userAgent = navigator && navigator.userAgent;

module.exports = userAgent ? String(userAgent) : '';


/***/ }),

/***/ 9519:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);
var userAgent = __webpack_require__(2839);

var process = globalThis.process;
var Deno = globalThis.Deno;
var versions = process && process.versions || Deno && Deno.version;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  // in old Chrome, versions of V8 isn't V8 = Chrome / 10
  // but their correct versions are not interesting for us
  version = match[0] > 0 && match[0] < 4 ? 1 : +(match[0] + match[1]);
}

// BrowserFS NodeJS `process` polyfill incorrectly set `.v8` to `0.0`
// so check `userAgent` even if `.v8` exists, but 0
if (!version && userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = +match[1];
  }
}

module.exports = version;


/***/ }),

/***/ 4215:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {


/* global Bun, Deno -- detection */
var globalThis = __webpack_require__(4576);
var userAgent = __webpack_require__(2839);
var classof = __webpack_require__(2195);

var userAgentStartsWith = function (string) {
  return userAgent.slice(0, string.length) === string;
};

module.exports = (function () {
  if (userAgentStartsWith('Bun/')) return 'BUN';
  if (userAgentStartsWith('Cloudflare-Workers')) return 'CLOUDFLARE';
  if (userAgentStartsWith('Deno/')) return 'DENO';
  if (userAgentStartsWith('Node.js/')) return 'NODE';
  if (globalThis.Bun && typeof Bun.version == 'string') return 'BUN';
  if (globalThis.Deno && typeof Deno.version == 'object') return 'DENO';
  if (classof(globalThis.process) === 'process') return 'NODE';
  if (globalThis.window && globalThis.document) return 'BROWSER';
  return 'REST';
})();


/***/ }),

/***/ 8574:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var uncurryThis = __webpack_require__(9504);

var $Error = Error;
var replace = uncurryThis(''.replace);

var TEST = (function (arg) { return String(new $Error(arg).stack); })('zxcasd');
// eslint-disable-next-line redos/no-vulnerable, sonarjs/slow-regex -- safe
var V8_OR_CHAKRA_STACK_ENTRY = /\n\s*at [^:]*:[^\n]*/;
var IS_V8_OR_CHAKRA_STACK = V8_OR_CHAKRA_STACK_ENTRY.test(TEST);

module.exports = function (stack, dropEntries) {
  if (IS_V8_OR_CHAKRA_STACK && typeof stack == 'string' && !$Error.prepareStackTrace) {
    while (dropEntries--) stack = replace(stack, V8_OR_CHAKRA_STACK_ENTRY, '');
  } return stack;
};


/***/ }),

/***/ 6518:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);
var getOwnPropertyDescriptor = (__webpack_require__(7347).f);
var createNonEnumerableProperty = __webpack_require__(6699);
var defineBuiltIn = __webpack_require__(6840);
var defineGlobalProperty = __webpack_require__(9433);
var copyConstructorProperties = __webpack_require__(7740);
var isForced = __webpack_require__(2796);

/*
  options.target         - name of the target object
  options.global         - target is the global object
  options.stat           - export as static methods of target
  options.proto          - export as prototype methods of target
  options.real           - real prototype method for the `pure` version
  options.forced         - export even if the native feature is available
  options.bind           - bind methods to the target, required for the `pure` version
  options.wrap           - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe         - use the simple assignment of property instead of delete + defineProperty
  options.sham           - add a flag to not completely full polyfills
  options.enumerable     - export as enumerable property
  options.dontCallGetSet - prevent calling a getter on target
  options.name           - the .name of the function if it does not match the key
*/
module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = globalThis;
  } else if (STATIC) {
    target = globalThis[TARGET] || defineGlobalProperty(TARGET, {});
  } else {
    target = globalThis[TARGET] && globalThis[TARGET].prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.dontCallGetSet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty == typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    defineBuiltIn(target, key, sourceProperty, options);
  }
};


/***/ }),

/***/ 9039:
/***/ ((module) => {


module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};


/***/ }),

/***/ 8745:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var NATIVE_BIND = __webpack_require__(616);

var FunctionPrototype = Function.prototype;
var apply = FunctionPrototype.apply;
var call = FunctionPrototype.call;

// eslint-disable-next-line es/no-reflect -- safe
module.exports = typeof Reflect == 'object' && Reflect.apply || (NATIVE_BIND ? call.bind(apply) : function () {
  return call.apply(apply, arguments);
});


/***/ }),

/***/ 6080:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var uncurryThis = __webpack_require__(7476);
var aCallable = __webpack_require__(9306);
var NATIVE_BIND = __webpack_require__(616);

var bind = uncurryThis(uncurryThis.bind);

// optional / simple context binding
module.exports = function (fn, that) {
  aCallable(fn);
  return that === undefined ? fn : NATIVE_BIND ? bind(fn, that) : function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};


/***/ }),

/***/ 616:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var fails = __webpack_require__(9039);

module.exports = !fails(function () {
  // eslint-disable-next-line es/no-function-prototype-bind -- safe
  var test = (function () { /* empty */ }).bind();
  // eslint-disable-next-line no-prototype-builtins -- safe
  return typeof test != 'function' || test.hasOwnProperty('prototype');
});


/***/ }),

/***/ 9565:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var NATIVE_BIND = __webpack_require__(616);

var call = Function.prototype.call;

module.exports = NATIVE_BIND ? call.bind(call) : function () {
  return call.apply(call, arguments);
};


/***/ }),

/***/ 350:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var DESCRIPTORS = __webpack_require__(3724);
var hasOwn = __webpack_require__(9297);

var FunctionPrototype = Function.prototype;
// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getDescriptor = DESCRIPTORS && Object.getOwnPropertyDescriptor;

var EXISTS = hasOwn(FunctionPrototype, 'name');
// additional protection from minified / mangled / dropped function names
var PROPER = EXISTS && (function something() { /* empty */ }).name === 'something';
var CONFIGURABLE = EXISTS && (!DESCRIPTORS || (DESCRIPTORS && getDescriptor(FunctionPrototype, 'name').configurable));

module.exports = {
  EXISTS: EXISTS,
  PROPER: PROPER,
  CONFIGURABLE: CONFIGURABLE
};


/***/ }),

/***/ 6706:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var uncurryThis = __webpack_require__(9504);
var aCallable = __webpack_require__(9306);

module.exports = function (object, key, method) {
  try {
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    return uncurryThis(aCallable(Object.getOwnPropertyDescriptor(object, key)[method]));
  } catch (error) { /* empty */ }
};


/***/ }),

/***/ 7476:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var classofRaw = __webpack_require__(2195);
var uncurryThis = __webpack_require__(9504);

module.exports = function (fn) {
  // Nashorn bug:
  //   https://github.com/zloirock/core-js/issues/1128
  //   https://github.com/zloirock/core-js/issues/1130
  if (classofRaw(fn) === 'Function') return uncurryThis(fn);
};


/***/ }),

/***/ 9504:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var NATIVE_BIND = __webpack_require__(616);

var FunctionPrototype = Function.prototype;
var call = FunctionPrototype.call;
var uncurryThisWithBind = NATIVE_BIND && FunctionPrototype.bind.bind(call, call);

module.exports = NATIVE_BIND ? uncurryThisWithBind : function (fn) {
  return function () {
    return call.apply(fn, arguments);
  };
};


/***/ }),

/***/ 9429:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);
var IS_NODE = __webpack_require__(6193);

module.exports = function (name) {
  if (IS_NODE) {
    try {
      return globalThis.process.getBuiltinModule(name);
    } catch (error) { /* empty */ }
    try {
      // eslint-disable-next-line no-new-func -- safe
      return Function('return require("' + name + '")')();
    } catch (error) { /* empty */ }
  }
};


/***/ }),

/***/ 7751:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var globalThis = __webpack_require__(4576);
var isCallable = __webpack_require__(4901);

var aFunction = function (argument) {
  return isCallable(argument) ? argument : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(globalThis[namespace]) : globalThis[namespace] && globalThis[namespace][method];
};


/***/ }),

/***/ 1767:
/***/ ((module) => {


// `GetIteratorDirect(obj)` abstract operation
// https://tc39.es/proposal-iterator-helpers/#sec-getiteratordirect
module.exports = function (obj) {
  return {
    iterator: obj,
    next: obj.next,
    done: false
  };
};


/***/ }),

/***/ 851:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var classof = __webpack_require__(6955);
var getMethod = __webpack_require__(5966);
var isNullOrUndefined = __webpack_require__(4117);
var Iterators = __webpack_require__(6269);
var wellKnownSymbol = __webpack_require__(8227);

var ITERATOR = wellKnownSymbol('iterator');

module.exports = function (it) {
  if (!isNullOrUndefined(it)) return getMethod(it, ITERATOR)
    || getMethod(it, '@@iterator')
    || Iterators[classof(it)];
};


/***/ }),

/***/ 81:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var call = __webpack_require__(9565);
var aCallable = __webpack_require__(9306);
var anObject = __webpack_require__(8551);
var tryToString = __webpack_require__(6823);
var getIteratorMethod = __webpack_require__(851);

var $TypeError = TypeError;

module.exports = function (argument, usingIterator) {
  var iteratorMethod = arguments.length < 2 ? getIteratorMethod(argument) : usingIterator;
  if (aCallable(iteratorMethod)) return anObject(call(iteratorMethod, argument));
  throw new $TypeError(tryToString(argument) + ' is not iterable');
};


/***/ }),

/***/ 5966:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var aCallable = __webpack_require__(9306);
var isNullOrUndefined = __webpack_require__(4117);

// `GetMethod` abstract operation
// https://tc39.es/ecma262/#sec-getmethod
module.exports = function (V, P) {
  var func = V[P];
  return isNullOrUndefined(func) ? undefined : aCallable(func);
};


/***/ }),

/***/ 3789:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var aCallable = __webpack_require__(9306);
var anObject = __webpack_require__(8551);
var call = __webpack_require__(9565);
var toIntegerOrInfinity = __webpack_require__(1291);
var getIteratorDirect = __webpack_require__(1767);

var INVALID_SIZE = 'Invalid size';
var $RangeError = RangeError;
var $TypeError = TypeError;
var max = Math.max;

var SetRecord = function (set, intSize) {
  this.set = set;
  this.size = max(intSize, 0);
  this.has = aCallable(set.has);
  this.keys = aCallable(set.keys);
};

SetRecord.prototype = {
  getIterator: function () {
    return getIteratorDirect(anObject(call(this.keys, this.set)));
  },
  includes: function (it) {
    return call(this.has, this.set, it);
  }
};

// `GetSetRecord` abstract operation
// https://tc39.es/proposal-set-methods/#sec-getsetrecord
module.exports = function (obj) {
  anObject(obj);
  var numSize = +obj.size;
  // NOTE: If size is undefined, then numSize will be NaN
  // eslint-disable-next-line no-self-compare -- NaN check
  if (numSize !== numSize) throw new $TypeError(INVALID_SIZE);
  var intSize = toIntegerOrInfinity(numSize);
  if (intSize < 0) throw new $RangeError(INVALID_SIZE);
  return new SetRecord(obj, intSize);
};


/***/ }),

/***/ 4576:
/***/ (function(module) {


var check = function (it) {
  return it && it.Math === Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
module.exports =
  // eslint-disable-next-line es/no-global-this -- safe
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  // eslint-disable-next-line no-restricted-globals -- safe
  check(typeof self == 'object' && self) ||
  check(typeof global == 'object' && global) ||
  check(typeof this == 'object' && this) ||
  // eslint-disable-next-line no-new-func -- fallback
  (function () { return this; })() || Function('return this')();


/***/ }),

/***/ 9297:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var uncurryThis = __webpack_require__(9504);
var toObject = __webpack_require__(8981);

var hasOwnProperty = uncurryThis({}.hasOwnProperty);

// `HasOwnProperty` abstract operation
// https://tc39.es/ecma262/#sec-hasownproperty
// eslint-disable-next-line es/no-object-hasown -- safe
module.exports = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty(toObject(it), key);
};


/***/ }),

/***/ 421:
/***/ ((module) => {


module.exports = {};


/***/ }),

/***/ 397:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var getBuiltIn = __webpack_require__(7751);

module.exports = getBuiltIn('document', 'documentElement');


/***/ }),

/***/ 5917:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var DESCRIPTORS = __webpack_require__(3724);
var fails = __webpack_require__(9039);
var createElement = __webpack_require__(4055);

// Thanks to IE8 for its funny defineProperty
module.exports = !DESCRIPTORS && !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function () { return 7; }
  }).a !== 7;
});


/***/ }),

/***/ 7055:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var uncurryThis = __webpack_require__(9504);
var fails = __webpack_require__(9039);
var classof = __webpack_require__(2195);

var $Object = Object;
var split = uncurryThis(''.split);

// fallback for non-array-like ES3 and non-enumerable old V8 strings
module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !$Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) === 'String' ? split(it, '') : $Object(it);
} : $Object;


/***/ }),

/***/ 3167:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var isCallable = __webpack_require__(4901);
var isObject = __webpack_require__(34);
var setPrototypeOf = __webpack_require__(2967);

// makes subclassing work correct for wrapped built-ins
module.exports = function ($this, dummy, Wrapper) {
  var NewTarget, NewTargetPrototype;
  if (
    // it can work only with native `setPrototypeOf`
    setPrototypeOf &&
    // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
    isCallable(NewTarget = dummy.constructor) &&
    NewTarget !== Wrapper &&
    isObject(NewTargetPrototype = NewTarget.prototype) &&
    NewTargetPrototype !== Wrapper.prototype
  ) setPrototypeOf($this, NewTargetPrototype);
  return $this;
};


/***/ }),

/***/ 3706:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var uncurryThis = __webpack_require__(9504);
var isCallable = __webpack_require__(4901);
var store = __webpack_require__(7629);

var functionToString = uncurryThis(Function.toString);

// this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
if (!isCallable(store.inspectSource)) {
  store.inspectSource = function (it) {
    return functionToString(it);
  };
}

module.exports = store.inspectSource;


/***/ }),

/***/ 1181:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var NATIVE_WEAK_MAP = __webpack_require__(8622);
var globalThis = __webpack_require__(4576);
var isObject = __webpack_require__(34);
var createNonEnumerableProperty = __webpack_require__(6699);
var hasOwn = __webpack_require__(9297);
var shared = __webpack_require__(7629);
var sharedKey = __webpack_require__(6119);
var hiddenKeys = __webpack_require__(421);

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var TypeError = globalThis.TypeError;
var WeakMap = globalThis.WeakMap;
var set, get, has;

var enforce = function (it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw new TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  /* eslint-disable no-self-assign -- prototype methods protection */
  store.get = store.get;
  store.has = store.has;
  store.set = store.set;
  /* eslint-enable no-self-assign -- prototype methods protection */
  set = function (it, metadata) {
    if (store.has(it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    store.set(it, metadata);
    return metadata;
  };
  get = function (it) {
    return store.get(it) || {};
  };
  has = function (it) {
    return store.has(it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    if (hasOwn(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return hasOwn(it, STATE) ? it[STATE] : {};
  };
  has = function (it) {
    return hasOwn(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};


/***/ }),

/***/ 4209:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var wellKnownSymbol = __webpack_require__(8227);
var Iterators = __webpack_require__(6269);

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};


/***/ }),

/***/ 4376:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var classof = __webpack_require__(2195);

// `IsArray` abstract operation
// https://tc39.es/ecma262/#sec-isarray
// eslint-disable-next-line es/no-array-isarray -- safe
module.exports = Array.isArray || function isArray(argument) {
  return classof(argument) === 'Array';
};


/***/ }),

/***/ 1108:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var classof = __webpack_require__(6955);

module.exports = function (it) {
  var klass = classof(it);
  return klass === 'BigInt64Array' || klass === 'BigUint64Array';
};


/***/ }),

/***/ 4901:
/***/ ((module) => {


// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
var documentAll = typeof document == 'object' && document.all;

// `IsCallable` abstract operation
// https://tc39.es/ecma262/#sec-iscallable
// eslint-disable-next-line unicorn/no-typeof-undefined -- required for testing
module.exports = typeof documentAll == 'undefined' && documentAll !== undefined ? function (argument) {
  return typeof argument == 'function' || argument === documentAll;
} : function (argument) {
  return typeof argument == 'function';
};


/***/ }),

/***/ 2796:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var fails = __webpack_require__(9039);
var isCallable = __webpack_require__(4901);

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value === POLYFILL ? true
    : value === NATIVE ? false
    : isCallable(detection) ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

module.exports = isForced;


/***/ }),

/***/ 4117:
/***/ ((module) => {


// we can't use just `it == null` since of `document.all` special case
// https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot-aec
module.exports = function (it) {
  return it === null || it === undefined;
};


/***/ }),

/***/ 34:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var isCallable = __webpack_require__(4901);

module.exports = function (it) {
  return typeof it == 'object' ? it !== null : isCallable(it);
};


/***/ }),

/***/ 3925:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var isObject = __webpack_require__(34);

module.exports = function (argument) {
  return isObject(argument) || argument === null;
};


/***/ }),

/***/ 6395:
/***/ ((module) => {


module.exports = false;


/***/ }),

/***/ 757:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var getBuiltIn = __webpack_require__(7751);
var isCallable = __webpack_require__(4901);
var isPrototypeOf = __webpack_require__(1625);
var USE_SYMBOL_AS_UID = __webpack_require__(7040);

var $Object = Object;

module.exports = USE_SYMBOL_AS_UID ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  var $Symbol = getBuiltIn('Symbol');
  return isCallable($Symbol) && isPrototypeOf($Symbol.prototype, $Object(it));
};


/***/ }),

/***/ 507:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var call = __webpack_require__(9565);

module.exports = function (record, fn, ITERATOR_INSTEAD_OF_RECORD) {
  var iterator = ITERATOR_INSTEAD_OF_RECORD ? record : record.iterator;
  var next = record.next;
  var step, result;
  while (!(step = call(next, iterator)).done) {
    result = fn(step.value);
    if (result !== undefined) return result;
  }
};


/***/ }),

/***/ 2652:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var bind = __webpack_require__(6080);
var call = __webpack_require__(9565);
var anObject = __webpack_require__(8551);
var tryToString = __webpack_require__(6823);
var isArrayIteratorMethod = __webpack_require__(4209);
var lengthOfArrayLike = __webpack_require__(6198);
var isPrototypeOf = __webpack_require__(1625);
var getIterator = __webpack_require__(81);
var getIteratorMethod = __webpack_require__(851);
var iteratorClose = __webpack_require__(9539);

var $TypeError = TypeError;

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var ResultPrototype = Result.prototype;

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_RECORD = !!(options && options.IS_RECORD);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose(iterator, 'normal', condition);
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_RECORD) {
    iterator = iterable.iterator;
  } else if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (!iterFn) throw new $TypeError(tryToString(iterable) + ' is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = lengthOfArrayLike(iterable); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && isPrototypeOf(ResultPrototype, result)) return result;
      } return new Result(false);
    }
    iterator = getIterator(iterable, iterFn);
  }

  next = IS_RECORD ? iterable.next : iterator.next;
  while (!(step = call(next, iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator, 'throw', error);
    }
    if (typeof result == 'object' && result && isPrototypeOf(ResultPrototype, result)) return result;
  } return new Result(false);
};


/***/ }),

/***/ 9539:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var call = __webpack_require__(9565);
var anObject = __webpack_require__(8551);
var getMethod = __webpack_require__(5966);

module.exports = function (iterator, kind, value) {
  var innerResult, innerError;
  anObject(iterator);
  try {
    innerResult = getMethod(iterator, 'return');
    if (!innerResult) {
      if (kind === 'throw') throw value;
      return value;
    }
    innerResult = call(innerResult, iterator);
  } catch (error) {
    innerError = true;
    innerResult = error;
  }
  if (kind === 'throw') throw value;
  if (innerError) throw innerResult;
