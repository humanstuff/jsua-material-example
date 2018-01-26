(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scopeRealmAttacher = scopeRealmAttacher;
exports.createRootAttacher = createRootAttacher;
exports.getOrigin = getOrigin;
exports.isOutOfContext = isOutOfContext;
exports.isDetached = isDetached;
exports.findNearestScopedContentView = findNearestScopedContentView;
exports.setFocusedView = setFocusedView;

var _util = require("./util");

var util = _interopRequireWildcard(_util);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _markers = require("./markers");

var markers = _interopRequireWildcard(_markers);

var _options = require("./options");

var options = _interopRequireWildcard(_options);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function scopeRealmAttacher(result) {
  var origin = exports.getOrigin(result);
  if (!origin) return;

  var view = result.view;

  var context = view.getAttribute("data-lynx-context");
  if (exports.isOutOfContext(origin, context)) return { discard: true };

  var realm = view.getAttribute("data-lynx-realm");
  if (!realm) return;

  var nearestContentView = exports.findNearestScopedContentView(origin, realm);
  if (!nearestContentView) return;

  if (resultIsStale(result, nearestContentView)) return { discard: true };

  return {
    attach: function attach() {
      var detachedViews = nearestContentView.lynxSetEmbeddedView(result.view, result.content.blob);
      setFocusedView(result.view);
      return detachedViews;
    }
  };
}

function createRootAttacher(rootView) {
  if (!rootView) throw new Error("'rootView' param is required.");

  markers.initialize(rootView);
  options.initialize(rootView);

  return function rootAttacher(result) {
    if (!rootView) return;

    if (resultIsStale(result, rootView.firstElementChild)) return { discard: true };
    if (result.view.getAttribute("data-lynx-context")) return { discard: true };

    function attachViewToRoot() {
      var detachedViews = [];

      while (rootView.firstElementChild) {
        detachedViews.push(rootView.removeChild(rootView.firstElementChild));
      }

      rootView.appendChild(result.view);

      var focusedView = exports.setFocusedView(result.view);
      if (!focusedView) result.view.setAttribute("data-jsua-focus", true);

      return detachedViews;
    }

    return {
      attach: attachViewToRoot
    };
  };
}

function resultIsStale(result, reference) {
  if (!reference) return false;
  var startedAt = result.content && result.content.options && result.content.options.startedAt && result.content.options.startedAt.valueOf();
  if (!startedAt) return false;
  return +reference.getAttribute("data-transfer-started-at") > startedAt;
}

function getOrigin(result) {
  if (!result) return;
  if (!result.content) return;
  if (!result.content.options) return;
  return result.content.options.origin;
}

function isOutOfContext(origin, context) {
  if (!context) return false;

  var contextView = util.findNearestView(origin, "[data-content-url],[data-lynx-realm]", function (matching) {
    if (exports.isDetached(matching)) return false;

    var url = matching.getAttribute("data-content-url");
    var realm = matching.getAttribute("data-lynx-realm");

    return util.scopeIncludesRealm(context, url) || util.scopeIncludesRealm(context, realm);
  });

  if (!contextView) return true;

  return false;
}

function isDetached(view) {
  var positionMask = document.body.compareDocumentPosition(view);
  var disconnected = positionMask & Node.DOCUMENT_POSITION_DISCONNECTED;
  return disconnected === Node.DOCUMENT_POSITION_DISCONNECTED;
}

function findNearestScopedContentView(origin, realm) {
  return util.findNearestView(origin, "[data-lynx-hints~=content][data-lynx-scope]", function (matching) {
    var scope = matching.getAttribute("data-lynx-scope");
    return util.scopeIncludesRealm(scope, realm);
  });
}

function setFocusedView(view) {
  var focusedViewName;

  if (view.hasAttribute("data-content-url")) {
    var contentUrl = _url2.default.parse(view.getAttribute("data-content-url"));
    if (contentUrl.hash) focusedViewName = contentUrl.hash.substring(1);
  }

  if (!focusedViewName && view.hasAttribute("data-lynx-focus")) focusedViewName = view.getAttribute("data-lynx-focus");

  if (!focusedViewName) {
    var subview = view.querySelector("[data-lynx-focus]");
    if (!subview) return;
    focusedViewName = subview.getAttribute("data-lynx-focus");
  }

  var focusedView = util.findNearestView(view, "[data-lynx-name='" + focusedViewName + "']");
  if (!focusedView) return;

  if (focusedView.lynxGetFocusableView) {
    focusedView = focusedView.lynxGetFocusableView();
  }

  focusedView.setAttribute("data-jsua-focus", true);
  return focusedView;
}
},{"./markers":21,"./options":22,"./util":24,"url":44}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.containerInputViewBuilder = containerInputViewBuilder;

var _containerViewBuilder = require("./container-view-builder");

var containers = _interopRequireWildcard(_containerViewBuilder);

var _nodeViewBuilder = require("./node-view-builder");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function containerInputViewBuilder(node) {
  function appendChildView(childView) {
    childView.setAttribute("data-lynx-container-input-value", true);

    var itemView = document.createElement("div");
    view.appendChild(itemView);
    itemView.setAttribute("data-lynx-container-input-item", true);
    itemView.appendChild(childView);

    var removeView = document.createElement("button");
    itemView.appendChild(removeView);
    removeView.setAttribute("data-lynx-container-input-remove", true);
    removeView.type = "button";
    removeView.textContent = "-";
    removeView.addEventListener("click", function () {
      view.removeChild(itemView);
      raiseValueChangeEvent(view);
    });

    return itemView;
  }

  var view = document.createElement("div");

  var addView = document.createElement("button");
  view.appendChild(addView);
  addView.setAttribute("data-lynx-container-input-add", true);
  addView.type = "button";
  addView.textContent = "+";
  addView.addEventListener("click", function () {
    view.lynxAddValue();
  });

  view.lynxAddValue = function (val) {
    var childNode = {
      base: node.base,
      spec: JSON.parse(JSON.stringify(node.spec.children)),
      value: val || null
    };

    return Promise.resolve(childNode).then(_nodeViewBuilder.nodeViewBuilder).then(appendChildView).then(function (itemView) {
      raiseValueChangeEvent(view);
      return itemView;
    }).catch(function (err) {
      console.log("Error adding value to container input.", err);
    });
  };

  view.lynxRemoveValue = function (val) {
    var valueToRemove = val || "";

    var itemViewsToRemove = Array.from(view.querySelectorAll("[data-lynx-container-input-value]")).filter(function (valueView) {
      return valueToRemove === valueView.lynxGetValue();
    }).map(function (valueView) {
      return valueView.parentElement;
    });

    if (itemViewsToRemove.length === 0) return;
    itemViewsToRemove.forEach(function (itemView) {
      return itemView.parentElement.removeChild(itemView);
    });
    raiseValueChangeEvent(view);
  };

  view.lynxGetValue = function () {
    return Array.from(view.querySelectorAll("[data-lynx-container-input-value]")).map(function (valueView) {
      return valueView.lynxGetValue();
    });
  };

  view.lynxSetValue = function (values) {
    view.lynxClearValue();
    if (!values) return;

    if (!Array.isArray(values)) values = [values];
    values.forEach(function (value) {
      return view.lynxAddValue(value);
    });
  };

  view.lynxHasValue = function (val) {
    return Array.from(view.querySelectorAll("[data-lynx-container-input-value]")).some(function (valueView) {
      return valueView.lynxGetValue() === val;
    });
  };

  view.lynxClearValue = function () {
    Array.from(view.querySelectorAll("[data-lynx-container-input-item]")).forEach(function (itemView) {
      return itemView.parentElement.removeChild(itemView);
    });
  };

  return containers.buildChildViews(node).then(function (childViews) {
    childViews.forEach(appendChildView);
    return view;
  });
}

function raiseValueChangeEvent(view) {
  var inputEvent = document.createEvent("Event");
  inputEvent.initEvent("input", true, false);
  view.dispatchEvent(inputEvent);

  var changeEvent = document.createEvent("Event");
  changeEvent.initEvent("change", true, false);
  view.dispatchEvent(changeEvent);
}
},{"./container-view-builder":3,"./node-view-builder":11}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.containerViewBuilder = containerViewBuilder;
exports.buildChildViews = buildChildViews;

var _nodeViewBuilder = require("./node-view-builder");

var nodes = _interopRequireWildcard(_nodeViewBuilder);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function containerViewBuilder(node) {
  var view = document.createElement("div");

  return buildChildViews(node).then(function (childViews) {
    childViews.forEach(function (childView) {
      return view.appendChild(childView);
    });
    return view;
  });
}

function buildChildViews(node) {
  function isNotNullOrUndefined(childNode) {
    return childNode !== undefined && childNode !== null;
  }

  if (node.value === undefined || node.value === null) return Promise.resolve([]);

  if (Array.isArray(node.value)) {
    var promisesForChildViews = node.value.map(function (child) {
      child.base = node.base;
      return child;
    }).map(nodes.nodeViewBuilder);

    return Promise.all(promisesForChildViews);
  }

  if (_typeof(node.value) === "object") {
    if (!Array.isArray(node.spec.children)) return Promise.resolve([]);

    var _promisesForChildViews = node.spec.children.map(function (childSpec) {
      return node.value[childSpec.name];
    }).filter(isNotNullOrUndefined).map(function (child) {
      child.base = node.base;
      return child;
    }).map(nodes.nodeViewBuilder);

    return Promise.all(_promisesForChildViews);
  }

  console.log("Unable to determine child nodes for node: ", node);
  return Promise.resolve([]);
}
},{"./node-view-builder":11}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.contentInputViewBuilder = contentInputViewBuilder;

var _contentNodeHelpers = require("./content-node-helpers");

var _jsua = require("@lynx-json/jsua");

function contentInputViewBuilder(node) {
  return new Promise(function (resolve, reject) {
    var view = document.createElement("div");

    var inputView = document.createElement("input");
    inputView.type = "file";
    inputView.name = node.spec.input || "";
    view.appendChild(inputView);

    var value, embeddedView;

    function setEmbeddedView(newEmbeddedView) {
      var detached = [];

      if (embeddedView) {
        detached.push(view.removeChild(embeddedView));
      }

      embeddedView = newEmbeddedView;
      if (!embeddedView) return detached;

      view.appendChild(embeddedView);
      embeddedView.setAttribute("data-lynx-embedded-view", true);

      if (node.value && node.value.alt) {
        embeddedView.setAttribute("alt", node.value.alt);
      }

      return detached;
    }

    view.lynxGetValue = function () {
      return value;
    };

    view.lynxSetValue = function (blob) {
      if (view.lynxHasValue(blob)) return;
      value = blob;

      if (!blob) {
        setEmbeddedView(null);
        raiseValueChangeEvent(view);
        return Promise.resolve(view);
      }

      var content = {
        url: blob.name || "",
        blob: blob
      };

      return Promise.resolve(content).then(_jsua.building.build).catch(function (err) {
        console.log("Error building the embedded view for a content input view.", err);
      }).then(function (result) {
        setEmbeddedView(result.view);
        raiseValueChangeEvent(view);
        return view;
      });
    };

    view.lynxClearValue = function () {
      view.lynxSetValue(null);
    };

    view.lynxHasValue = function (blob) {
      return value === blob; // TODO: fix this comparison
    };

    view.lynxSetEmbeddedView = function (newView, newBlob) {
      if (view.lynxHasValue(newBlob)) return;
      value = newBlob;

      var detached = setEmbeddedView(newView);
      raiseValueChangeEvent(view);

      return detached;
    };

    inputView.addEventListener("change", function (evt) {
      view.lynxSetValue(inputView.files[0]);
    });

    if (!node.value) return resolve(view);

    var promiseForView;

    if ("data" in node.value) {
      promiseForView = view.lynxSetValue((0, _contentNodeHelpers.getBlob)(node));
    } else if ("src" in node.value) {
      promiseForView = (0, _contentNodeHelpers.getPromiseForRequest)(node).then(_jsua.transferring.transfer).catch(function (err) {
        // intentionally eat a transfer error here b/c primary task is file upload
        return null;
      }).then(function (content) {
        if (!content) return view;
        content.blob.name = content.url;
        return view.lynxSetValue(content.blob);
      });
    }

    promiseForView.then(resolve, reject);
  });
}

function raiseValueChangeEvent(view) {
  var inputEvent = document.createEvent("Event");
  inputEvent.initEvent("input", true, false);
  view.dispatchEvent(inputEvent);

  var changeEvent = document.createEvent("Event");
  changeEvent.initEvent("change", true, false);
  view.dispatchEvent(changeEvent);
}
},{"./content-node-helpers":5,"@lynx-json/jsua":29}],5:[function(require,module,exports){
(function (Buffer){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.getBlob = getBlob;
exports.getPromiseForRequest = getPromiseForRequest;

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getBlob(node) {
  var data = node.value.data || "";

  if ((typeof data === "undefined" ? "undefined" : _typeof(data)) === "object") {
    // JSON was parsed by Lynx JSON parser
    // convert it back to a string
    data = JSON.stringify(data);
  }

  var buf = new Buffer(data, node.value.encoding || "utf8");
  var blob = new Blob([buf], { type: node.value.type });

  return blob;
}

function getPromiseForRequest(node) {
  if (node.value.src) {
    var src = _url2.default.resolve(node.base || "", node.value.src);

    var request = { url: src };
    if (node.value.type) request.options = { type: node.value.type };

    return Promise.resolve(request);
  }

  if (node.value.data && _typeof(node.value.data) === "object") {
    if (node.value.type && node.value.type.indexOf("application/lynx+json") > -1) {
      // this Lynx JSON has already been parsed
      // we can optimize (do not serialize or parse again) 
      // its transferring and building by using the "lynx" protocol

      var _request = {
        url: "lynx:?ts=" + new Date().valueOf(),
        options: {
          document: node.value.data,
          type: node.value.type
        }
      };

      return Promise.resolve(_request);
    }
  }

  return new Promise(function (resolve, reject) {
    var blob = getBlob(node);
    var fileReader = new FileReader();

    fileReader.onloadend = function (evt) {
      var request = {
        url: evt.target.result,
        options: {
          type: node.value.type
        }
      };

      resolve(request);
    };

    fileReader.onerror = function (evt) {
      reject(evt.target.error);
    };

    fileReader.readAsDataURL(blob);
  });
}
}).call(this,require("buffer").Buffer)
},{"buffer":35,"url":44}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.contentViewBuilder = contentViewBuilder;

var _contentNodeHelpers = require("./content-node-helpers");

var _jsua = require("@lynx-json/jsua");

function contentViewBuilder(node) {
  var view = document.createElement("div");
  var embeddedView, value;

  view.lynxGetValue = function () {
    return value;
  };

  view.lynxGetEmbeddedView = function () {
    return embeddedView;
  };

  view.lynxSetEmbeddedView = function (newView, newBlob) {
    var detached = [];

    value = newBlob;

    embeddedView.parentElement.replaceChild(newView, embeddedView);
    detached.push(embeddedView);

    embeddedView = newView;

    embeddedView.setAttribute("data-lynx-embedded-view", true);

    if (node.value.alt) {
      embeddedView.setAttribute("alt", node.value.alt);
    }

    return detached;
  };

  embeddedView = document.createElement("div");
  embeddedView.setAttribute("role", "presentation");
  embeddedView.setAttribute("data-lynx-embedded-view", true);
  view.appendChild(embeddedView);

  if (node.value.src || node.value.data) {
    return (0, _contentNodeHelpers.getPromiseForRequest)(node).then(_jsua.transferring.transfer).then(_jsua.building.build).then(function (result) {
      view.lynxSetEmbeddedView(result.view, result.content.blob);
      return view;
    });
  }

  return Promise.resolve(view);
}
},{"./content-node-helpers":5,"@lynx-json/jsua":29}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formViewBuilder = formViewBuilder;

var _containerViewBuilder = require("./container-view-builder");

var containers = _interopRequireWildcard(_containerViewBuilder);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function formViewBuilder(node) {
  var view = document.createElement("form");
  view.autocomplete = "off";
  view.setAttribute("novalidate", "novalidate");

  return containers.buildChildViews(node).then(function (childViews) {
    childViews.forEach(function (childView) {
      return view.appendChild(childView);
    });
    return view;
  });
}
},{"./container-view-builder":3}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.imageViewBuilder = imageViewBuilder;

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _contentViewBuilder = require("./content-view-builder");

var _contentNodeHelpers = require("./content-node-helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function applyImageAttributes(node) {
  return function (view) {
    var embeddedView = view.lynxGetEmbeddedView();
    if (!embeddedView) return view;

    var height = parseInt(node.value.height);
    if (height) embeddedView.setAttribute("data-lynx-height", height);

    var width = parseInt(node.value.width);
    if (width) embeddedView.setAttribute("data-lynx-width", width);

    return view;
  };
}

function buildAsEmbeddedImageTag(node) {
  var view = document.createElement("div");
  var embeddedView, value;

  view.lynxGetValue = function () {
    return value;
  };

  view.lynxGetEmbeddedView = function () {
    return embeddedView;
  };

  view.lynxSetEmbeddedView = function (newView, newBlob) {
    var detached = [];

    if (embeddedView) {
      detached.push(view.removeChild(embeddedView));
    }

    embeddedView = newView;
    value = newBlob;

    if (!embeddedView) return detached;

    view.appendChild(embeddedView);
    embeddedView.setAttribute("data-lynx-embedded-view", true);

    if (node.value.alt) {
      embeddedView.setAttribute("alt", node.value.alt);
    }

    return detached;
  };

  var imageView = document.createElement("img");
  imageView.src = _url2.default.resolve(node.base || "", node.value.src);
  imageView.setAttribute("data-content-url", imageView.src);
  imageView.setAttribute("data-content-type", node.value.type);
  view.lynxSetEmbeddedView(imageView, (0, _contentNodeHelpers.getBlob)(node));

  return Promise.resolve(view);
}

function imageViewBuilder(node) {
  if (node.value.src) return buildAsEmbeddedImageTag(node).then(applyImageAttributes(node));else return (0, _contentViewBuilder.contentViewBuilder)(node).then(applyImageAttributes(node));
}
},{"./content-node-helpers":5,"./content-view-builder":6,"url":44}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.submitViewBuilder = exports.linkViewBuilder = exports.imageViewBuilder = exports.contentInputViewBuilder = exports.contentViewBuilder = exports.formViewBuilder = exports.containerInputViewBuilder = exports.containerViewBuilder = exports.textInputViewBuilder = exports.textViewBuilder = exports.nodeViewBuilder = exports.resolveViewBuilder = undefined;

var _resolveViewBuilder = require("./resolve-view-builder");

var _nodeViewBuilder = require("./node-view-builder");

var _textViewBuilder = require("./text-view-builder");

var _textInputViewBuilder = require("./text-input-view-builder");

var _containerViewBuilder = require("./container-view-builder");

var _containerInputViewBuilder = require("./container-input-view-builder");

var _formViewBuilder = require("./form-view-builder");

var _contentViewBuilder = require("./content-view-builder");

var _imageViewBuilder = require("./image-view-builder");

var _contentInputViewBuilder = require("./content-input-view-builder");

var _linkViewBuilder = require("./link-view-builder");

var _submitViewBuilder = require("./submit-view-builder");

exports.resolveViewBuilder = _resolveViewBuilder.resolveViewBuilder;
exports.nodeViewBuilder = _nodeViewBuilder.nodeViewBuilder;
exports.textViewBuilder = _textViewBuilder.textViewBuilder;
exports.textInputViewBuilder = _textInputViewBuilder.textInputViewBuilder;
exports.containerViewBuilder = _containerViewBuilder.containerViewBuilder;
exports.containerInputViewBuilder = _containerInputViewBuilder.containerInputViewBuilder;
exports.formViewBuilder = _formViewBuilder.formViewBuilder;
exports.contentViewBuilder = _contentViewBuilder.contentViewBuilder;
exports.contentInputViewBuilder = _contentInputViewBuilder.contentInputViewBuilder;
exports.imageViewBuilder = _imageViewBuilder.imageViewBuilder;
exports.linkViewBuilder = _linkViewBuilder.linkViewBuilder;
exports.submitViewBuilder = _submitViewBuilder.submitViewBuilder;
},{"./container-input-view-builder":2,"./container-view-builder":3,"./content-input-view-builder":4,"./content-view-builder":6,"./form-view-builder":7,"./image-view-builder":8,"./link-view-builder":10,"./node-view-builder":11,"./resolve-view-builder":13,"./submit-view-builder":14,"./text-input-view-builder":15,"./text-view-builder":16}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDataUri = createDataUri;
exports.getHref = getHref;
exports.linkViewBuilder = linkViewBuilder;

var _containerViewBuilder = require("./container-view-builder");

var containers = _interopRequireWildcard(_containerViewBuilder);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _jsua = require("@lynx-json/jsua");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function createDataUri(link) {
  var contentType = link.type;
  var encoding = link.encoding || "utf-8";

  if (encoding !== "utf-8" && encoding !== "base64") throw new Error("The 'encoding' property value for a link must be 'utf-8' or 'base64'.");

  var dataUri = "data:" + contentType;

  if (encoding === "base64") {
    dataUri += ";base64,";
  } else {
    dataUri += ",";
  }

  if (encoding === "utf-8" && typeof link.data !== "string") {
    dataUri += JSON.stringify(link.data);
  } else {
    dataUri += link.data;
  }

  return dataUri;
}

function getHref(node) {
  var link = node.value;

  if ("data" in link) {
    // data
    if (!link.type) throw new Error("A link with a 'data' property must have a valid 'type' property.");

    if (link.type.indexOf("application/lynx+json") > -1) {
      return "lynx:?ts=" + new Date().valueOf();
    } else {
      return exports.createDataUri(link);
    }
  } else {
    // href
    if (node.base) {
      return _url2.default.resolve(node.base, link.href);
    } else {
      return link.href;
    }
  }
}

function linkViewBuilder(node) {
  var view = document.createElement("a");
  var followTimerId;

  view.href = getHref(node);
  if (node.value.type) view.type = node.value.type;

  var followTimeout = tryGetFollowTimeout(node);

  function getOptions(automatic) {
    var options = { origin: view };

    if (automatic) options.automatic = true;

    if (view.protocol === "lynx:") {
      options.document = node.value.data;
    }

    return options;
  }

  if (followTimeout) {
    view.addEventListener("jsua-attach", function () {
      followTimerId = setTimeout(function () {
        (0, _jsua.fetch)(view.href, getOptions(true));
      }, followTimeout);
    });
  }

  view.addEventListener("click", function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (followTimerId) clearTimeout(followTimerId);
    (0, _jsua.fetch)(view.href, getOptions());
  });

  return containers.buildChildViews(node).then(function (childViews) {
    childViews.forEach(function (childView) {
      return view.appendChild(childView);
    });

    if (view.children.length === 0) {
      view.textContent = view.href;
    }

    return view;
  });
}

function tryGetFollowTimeout(node) {
  var follow = +node.value.follow;
  if (isNaN(follow)) follow = +node.spec.follow;
  if (isNaN(follow)) return;
  return follow < 10 ? 10 : follow;
}
},{"./container-view-builder":3,"@lynx-json/jsua":29,"url":44}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.nodeViewBuilder = nodeViewBuilder;
exports.createConcealmentControlView = createConcealmentControlView;

var _building = require("../building");

var building = _interopRequireWildcard(_building);

var _resolveViewBuilder = require("./resolve-view-builder");

var resolver = _interopRequireWildcard(_resolveViewBuilder);

var _validation = require("./validation");

var validation = _interopRequireWildcard(_validation);

var _options = require("./options");

var options = _interopRequireWildcard(_options);

var _util = require("../util");

var util = _interopRequireWildcard(_util);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function hasScope(node) {
  return node.value && _typeof(node.value) === "object" && "scope" in node.value;
}

function didNotUnderstandNodeViewBuilder(node) {
  return document.createElement("div");
}

function nodeViewBuilder(node) {
  if (!node) return Promise.reject(new Error("'node' param is required."));
  if (!node.spec) return Promise.reject(new Error("'spec' property not found."));
  if (!node.spec.hints || node.spec.hints.length === 0) return Promise.reject(new Error("'hints' property not found or zero length."));

  if (node.spec.input && node.spec.input === true) node.spec.input = node.spec.name;

  var builder = resolver.resolveViewBuilder(building.registrations, node);
  if (!builder) builder = didNotUnderstandNodeViewBuilder;

  return new Promise(function (resolve, reject) {
    try {
      var view = builder(node);
      resolve(view);
    } catch (e) {
      reject(e);
    }
  }).then(function (view) {
    view.setAttribute("data-lynx-hints", node.spec.hints.join(" "));
    addVisibilityExtensionsToView(view, node.spec.visibility);

    if (node.spec.name) {
      view.setAttribute("data-lynx-name", node.spec.name);
      var fragmentComponent = "#" + node.spec.name;
      if (node.base) {
        view.setAttribute("data-jsua-view-uri", _url2.default.resolve(node.base, fragmentComponent));
      }
    }

    if (hasScope(node)) view.setAttribute("data-lynx-scope", node.value.scope);
    if (!!node.spec.input) view.setAttribute("data-lynx-input", node.spec.input);
    if (node.spec.labeledBy) view.setAttribute("data-lynx-labeled-by", node.spec.labeledBy);
    if (node.spec.submitter) addSubmitterExtensionsToView(view, node.spec.submitter);
    if (node.spec.validation || node.spec.hints.some(function (hint) {
      return hint === "form";
    })) validation.addValidationExtensionsToView(view, node.spec.validation || {});
    if (node.spec.option) view.setAttribute("data-lynx-option", "true");
    if (node.spec.options) options.addOptionsExtensionsToView(view, node.spec);
    if (node.spec.hints.indexOf("marker") > -1 && node.value && node.value.for) {
      view.setAttribute("data-lynx-marker-for", _url2.default.resolve(node.base, node.value.for));
    }

    if (node.value && _typeof(node.value) === "object" && !Array.isArray(node.value)) {
      for (var p in node.value) {
        // Any specified child of the node would be an object with a spec.
        // This code assumes we only want to put non-object values in the attribute.
        if (_typeof(node.value[p]) !== "object") {
          view.setAttribute("data-lynx-var-" + p, node.value[p]);
        }
      }
    }

    return view;
  });
}

function addSubmitterExtensionsToView(view, submitterName) {
  function handleKeyDown(e) {
    if (e.keyCode !== 13) return;

    var submitter = util.findNearestView(view, "[data-lynx-name='" + submitterName + "']");

    if (submitter && submitter.click && typeof submitter.click === "function") {
      e.stopPropagation();
      e.preventDefault();
      submitter.click();
    }
  }
  view.setAttribute("data-lynx-submitter", submitterName);
  view.addEventListener("keydown", handleKeyDown);
}

function addVisibilityExtensionsToView(view, initialVisibility) {
  view.lynxGetVisibility = function () {
    return view.getAttribute("data-lynx-visibility");
  };

  view.lynxSetVisibility = function (visibility) {
    if (view.lynxGetVisibility() === visibility) return;
    view.setAttribute("data-lynx-visibility", visibility);
    raiseVisibilityChangedEvent(view);
  };

  initialVisibility = initialVisibility || "visible";
  view.setAttribute("data-lynx-visibility", initialVisibility);

  if (initialVisibility !== "concealed" && initialVisibility !== "revealed") return;

  var concealmentControlView = exports.createConcealmentControlView(view);
  if (view.firstElementChild) {
    view.insertBefore(concealmentControlView, view.firstElementChild);
  } else {
    view.appendChild(concealmentControlView);
  }
}

function raiseVisibilityChangedEvent(view) {
  var changeEvent = document.createEvent("Event");
  changeEvent.initEvent("lynx-visibility-change", true, false);
  view.dispatchEvent(changeEvent);
}

function createConcealmentControlView(view) {
  var visibilityControlView = document.createElement("button");
  visibilityControlView.type = "button";
  visibilityControlView.setAttribute("data-lynx-visibility-conceal", true);

  var concealView = document.createTextNode("Conceal");

  view.lynxGetConcealView = function () {
    return concealView;
  };

  view.lynxSetConcealView = function (cv) {
    concealView = cv;
    synchronizeVisibilityControlView();
  };

  var revealView = document.createTextNode("Reveal");

  view.lynxGetRevealView = function () {
    return revealView;
  };

  view.lynxSetRevealView = function (rv) {
    revealView = rv;
    synchronizeVisibilityControlView();
  };

  function synchronizeVisibilityControlView() {
    while (visibilityControlView.firstChild) {
      visibilityControlView.removeChild(visibilityControlView.firstChild);
    }

    var visibility = view.lynxGetVisibility();

    if (visibility === "concealed") {
      visibilityControlView.appendChild(view.lynxGetRevealView());
    } else if (visibility === "revealed") {
      visibilityControlView.appendChild(view.lynxGetConcealView());
    } else {
      view.removeEventListener("lynx-visibility-change", synchronizeVisibilityControlView);
      view.removeChild(visibilityControlView);
      delete view.lynxGetConcealView;
      delete view.lynxSetConcealView;
      delete view.lynxGetRevealView;
      delete view.lynxSetRevealView;
      visibilityControlView = revealView = concealView = null;
    }
  }

  view.addEventListener("lynx-visibility-change", synchronizeVisibilityControlView);

  visibilityControlView.addEventListener("click", function (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    var visibility = view.lynxGetVisibility();

    if (visibility === "concealed") {
      view.lynxSetVisibility("revealed");
    } else if (visibility === "revealed") {
      view.lynxSetVisibility("concealed");
    }
  });

  synchronizeVisibilityControlView();

  return visibilityControlView;
}
},{"../building":19,"../util":24,"./options":12,"./resolve-view-builder":13,"./validation":17,"url":44}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addOptionsExtensionsToView = addOptionsExtensionsToView;
exports.initializeOptionsInterface = initializeOptionsInterface;
exports.initializeOptionInterface = initializeOptionInterface;
exports.raiseOptionSelectedChangeEvent = raiseOptionSelectedChangeEvent;
exports.raiseOptionsConnectedEvent = raiseOptionsConnectedEvent;
exports.raiseOptionsDisonnectedEvent = raiseOptionsDisonnectedEvent;
exports.raiseOptionAttachedEvent = raiseOptionAttachedEvent;
exports.findOptionView = findOptionView;

var _util = require("../util");

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function addOptionsExtensionsToView(inputView, spec) {
  var optionsView;
  var isContainerInput = inputView.matches("[data-lynx-hints~=container]");
  inputView.setAttribute("data-lynx-options-name", spec.options);

  inputView.lynxConnectOptions = function () {
    if (optionsView) return;

    var nearestOptionsView = util.findNearestView(inputView, "[data-lynx-name='" + spec.options + "']");
    if (!nearestOptionsView) return;

    optionsView = nearestOptionsView;
    inputView.setAttribute("data-lynx-options-connected", true);

    var optionValueHint = isContainerInput ? spec.children.hints[0] : spec.hints[0];

    function findAndInitializeOptionViews(originView, shouldRaiseOptionAddedEvent) {
      var optionValueViews = originView.querySelectorAll("[data-lynx-hints~='" + optionValueHint + "']");

      Array.from(optionValueViews).forEach(function (optionValueView) {
        var optionView = exports.findOptionView(optionsView, optionValueView);
        if (!optionView) return;
        exports.initializeOptionInterface(optionsView, optionView, optionValueView, inputView);
        if (shouldRaiseOptionAddedEvent) exports.raiseOptionAttachedEvent(optionView);
      });
    }

    exports.initializeOptionsInterface(optionsView, inputView, isContainerInput);
    findAndInitializeOptionViews(optionsView);

    function onInputViewDetach(evt) {
      if (evt.target !== inputView) return;
      inputView.lynxDisconnectOptions();
    }

    function onOptionsViewAttach(evt) {
      findAndInitializeOptionViews(evt.target, true);
    }

    inputView.lynxDisconnectOptions = function () {
      inputView.removeEventListener("jsua-detach", onInputViewDetach);
      delete inputView.lynxGetOptionsView;
      if (!optionsView) return;
      optionsView.lynxDisconnectOptions();
      optionsView.removeEventListener("jsua-attach", onOptionsViewAttach);
      optionsView = null;
    };

    inputView.addEventListener("jsua-detach", onInputViewDetach);
    optionsView.addEventListener("jsua-attach", onOptionsViewAttach);

    inputView.lynxGetOptionsView = function () {
      return optionsView;
    };

    exports.raiseOptionsConnectedEvent(optionsView);
  };
}

function initializeOptionsInterface(optionsView, inputView, isContainerInput) {
  optionsView.lynxOptions = [];

  optionsView.setAttribute("data-lynx-options-role", "options");

  optionsView.lynxToggleOption = function (optionView) {
    if (isContainerInput) {
      optionView.lynxToggleSelected();

      if (optionView.lynxGetSelected()) {
        inputView.lynxAddValue(optionView.lynxGetValue());
      } else {
        inputView.lynxRemoveValue(optionView.lynxGetValue());
      }
    } else {
      var selectedOptionView = optionsView.querySelector("[data-lynx-option-selected=true]");

      optionView.lynxToggleSelected();
      if (selectedOptionView && selectedOptionView !== optionView) selectedOptionView.lynxToggleSelected();

      if (optionView.lynxGetSelected()) {
        inputView.lynxSetValue(optionView.lynxGetValue());
      } else {
        inputView.lynxClearValue();
      }
    }
  };

  optionsView.lynxGetInputView = function () {
    return inputView;
  };

  function inputChanged() {
    var values = inputView.lynxGetValue();

    if (!Array.isArray(values)) values = [values];

    optionsView.lynxOptions.forEach(function (optionView) {
      var selected = values.indexOf(optionView.lynxGetValue()) > -1;
      optionView.lynxSetSelected(selected);
    });
  }

  inputView.addEventListener("change", inputChanged);

  optionsView.lynxDisconnectOptions = function () {
    inputView.removeEventListener("change", inputChanged);
    var optionViews = optionsView.lynxOptions;
    optionsView.lynxOptions.forEach(function (optionView) {
      return optionView.lynxDisconnectOption();
    });
    delete optionsView.lynxOptions;
    delete optionsView.lynxToggleOption;
    delete optionsView.lynxDisconnectOptions;
    delete optionsView.lynxGetInputView;
    optionsView.removeAttribute("data-lynx-options-role");
    exports.raiseOptionsDisonnectedEvent(optionsView, optionViews);
  };
}

function initializeOptionInterface(optionsView, optionView, optionValueView, inputView) {
  optionView.lynxSetSelected = function (selected) {
    if (selected === optionView.lynxGetSelected()) return;
    optionView.setAttribute("data-lynx-option-selected", selected);
    exports.raiseOptionSelectedChangeEvent(optionView);
  };

  optionView.lynxGetSelected = function () {
    var selected = optionView.getAttribute("data-lynx-option-selected");
    return "true" === selected;
  };

  if (optionView !== optionValueView) {
    optionView.lynxGetValue = function () {
      return optionValueView.lynxGetValue();
    };
  }

  optionView.lynxToggleSelected = function () {
    if (optionView.lynxGetSelected()) {
      optionView.lynxSetSelected(false);
    } else {
      optionView.lynxSetSelected(true);
    }
  };

  function optionClicked(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    optionsView.lynxToggleOption(optionView);
  }

  optionView.addEventListener("click", optionClicked);

  optionView.lynxDisconnectOption = function () {
    optionView.removeEventListener("click", optionClicked);
    optionView.removeAttribute("data-lynx-option-selected");
    delete optionView.lynxSetSelected;
    delete optionView.lynxGetSelected;
    if (optionView !== optionValueView) delete optionView.lynxGetValue;
    delete optionView.lynxToggleSelected;
    delete optionView.lynxDisconnectOption;
  };

  optionsView.lynxOptions.push(optionView);
  optionView.setAttribute("data-lynx-option-selected", false);
  optionView.lynxSetSelected(inputView.lynxHasValue(optionView.lynxGetValue()));
}

function raiseOptionSelectedChangeEvent(optionView) {
  var changeEvent = document.createEvent("Event");

  if (optionView.lynxGetSelected()) {
    changeEvent.initEvent("lynx-option-selected", true, false);
  } else {
    changeEvent.initEvent("lynx-option-deselected", true, false);
  }

  optionView.dispatchEvent(changeEvent);
}

function raiseOptionsConnectedEvent(optionsView) {
  var connectedEvent = document.createEvent("Event");
  connectedEvent.initEvent("lynx-options-connected", true, false);
  optionsView.dispatchEvent(connectedEvent);
}

function raiseOptionsDisonnectedEvent(optionsView, optionViews) {
  var disconnectedEvent = document.createEvent("Event");
  disconnectedEvent.initEvent("lynx-options-disconnected", true, false);
  disconnectedEvent.lynxOptions = optionViews;
  optionsView.dispatchEvent(disconnectedEvent);
}

function raiseOptionAttachedEvent(optionView) {
  var attached = document.createEvent("Event");
  attached.initEvent("lynx-option-attached", true, false);
  optionView.dispatchEvent(attached);
}

function findOptionView(optionsView, optionValueView) {
  var currentView = optionValueView;

  do {
    if (currentView.matches("[data-lynx-option=true]")) return currentView;
    currentView = currentView.parentElement;
  } while (currentView !== optionsView);

  return null;
}
},{"../util":24}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveViewBuilder = resolveViewBuilder;
function resolveViewBuilder(registrations, node) {
  function matches(hint) {
    return function (registration) {
      return registration.hint === hint && (!registration.condition || registration.condition(node));
    };
  }

  var registration;
  node.spec.hints.some(function (hint) {
    registration = registrations.find(matches(hint));
    return !!registration;
  });

  if (registration) return registration.builder;
  return null;
}
},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.submitViewBuilder = submitViewBuilder;

var _containerViewBuilder = require("./container-view-builder");

var containers = _interopRequireWildcard(_containerViewBuilder);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _util = require("../util");

var util = _interopRequireWildcard(_util);

var _jsua = require("@lynx-json/jsua");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function submitViewBuilder(node) {
  var view = document.createElement("button");

  if (node.base) {
    view.formAction = _url2.default.resolve(node.base, node.value.action);
  } else {
    view.formAction = node.value.action;
  }

  if (node.value.method) view.setAttribute("data-lynx-submit-method", node.value.method);
  if (node.value.enctype) view.setAttribute("data-lynx-submit-enctype", node.value.enctype);

  var sendDirective = getSendDirective(node);
  if (sendDirective) {
    view.setAttribute("data-lynx-send", sendDirective);
    addSendExtensionToView(view);
  }

  view.addEventListener("click", function (evt) {
    evt.preventDefault();
    evt.stopPropagation();

    var formAction = view.formAction;
    var formMethod = view.getAttribute("data-lynx-submit-method") && view.getAttribute("data-lynx-submit-method").toUpperCase() || "GET";
    var options = {
      method: formMethod,
      origin: view
    };

    var formData = util.buildFormData(view);

    if (formData) {
      if (formMethod === "POST" || formMethod === "PUT") {
        options.body = formData;
      } else {
        var temp = _url2.default.parse(formAction);
        temp.search = "?" + formData.toString();
        formAction = _url2.default.format(temp);
      }
    }

    (0, _jsua.fetch)(formAction, options);
  });

  return containers.buildChildViews(node).then(function (childViews) {
    childViews.forEach(function (childView) {
      return view.appendChild(childView);
    });

    if (view.children.length === 0) {
      view.textContent = "Submit";
    }

    return view;
  });
}

function getSendDirective(node) {
  if (node.value.send === "change" || node.spec.send === "change") return "change";
  if (node.value.send === "ready") return "ready";
}

function addSendExtensionToView(view) {
  view.addEventListener("jsua-attach", function () {
    var sendDirective = view.getAttribute("data-lynx-send");
    var formView = util.findNearestAncestorView(view, "[data-lynx-hints~=form]");

    function autoSubmitFormIfValid() {
      if (formView && formView.lynxGetValidationState() === "invalid") return;
      view.click();
    }
    if (sendDirective === "ready") {
      setTimeout(function () {
        view.click();
      }, 10);
    } else if (sendDirective === "change") {
      formView.addEventListener("lynx-validated", autoSubmitFormIfValid);

      view.addEventListener("jsua-detach", function () {
        formView.removeEventListener("lynx-validated", autoSubmitFormIfValid);
      });
    }
  });
}
},{"../util":24,"./container-view-builder":3,"@lynx-json/jsua":29,"url":44}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.textInputViewBuilder = textInputViewBuilder;
function textInputViewBuilder(node) {
  var view = document.createElement("div");

  var isLine = node.spec.hints.some(function (hint) {
    return hint === "line";
  });

  var textView = isLine ? document.createElement("input") : document.createElement("textarea");

  textView.name = node.spec.input || "";

  if (node.value === null || node.value === undefined) {
    textView.value = "";
  } else {
    textView.value = node.value.toString();
  }

  view.appendChild(textView);

  view.lynxGetValue = function () {
    return textView.value;
  };

  view.lynxSetValue = function (val) {
    if (textView.value === val) return;
    textView.value = val;
    raiseValueChangeEvent(textView);
  };

  view.lynxHasValue = function (val) {
    return textView.value === val;
  };

  view.lynxClearValue = function () {
    view.lynxSetValue("");
  };

  view.lynxGetFocusableView = function () {
    return textView;
  };

  return view;
}

function raiseValueChangeEvent(view) {
  var inputEvent = document.createEvent("Event");
  inputEvent.initEvent("input", true, false);
  view.dispatchEvent(inputEvent);

  var changeEvent = document.createEvent("Event");
  changeEvent.initEvent("change", true, false);
  view.dispatchEvent(changeEvent);
}
},{}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.textViewBuilder = textViewBuilder;
function textViewBuilder(node) {
  var view = document.createElement("div");
  var textView = document.createElement("pre");

  view.appendChild(textView);

  if (node.value === null || node.value === undefined) {
    textView.textContent = "";
  } else {
    textView.textContent = node.value.toString();
  }

  view.lynxGetValue = function () {
    return textView.textContent;
  };

  return view;
}
},{}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getValidator = getValidator;
exports.updateContentTargetVisibility = updateContentTargetVisibility;
exports.addValidationExtensionsToView = addValidationExtensionsToView;
exports.resolveValidationStateOfDescendants = resolveValidationStateOfDescendants;
exports.validateContainer = validateContainer;
exports.addValidationExtensionsToContainerView = addValidationExtensionsToContainerView;
exports.formatValue = formatValue;
exports.addValidationExtensionsToInputView = addValidationExtensionsToInputView;
exports.validateValue = validateValue;
exports.raiseValidationStateChangedEvent = raiseValidationStateChangedEvent;
exports.raiseValidatedEvent = raiseValidatedEvent;
exports.normalizeValidationConstraintSetObject = normalizeValidationConstraintSetObject;
exports.isValidationConstraintName = isValidationConstraintName;
exports.resolveValidationState = resolveValidationState;

var _util = require("../../util");

var util = _interopRequireWildcard(_util);

var _validators = require("./validators");

var validators = _interopRequireWildcard(_validators);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var validatorsByConstraint = {
  required: "requiredValidator",
  text: "textValidator",
  number: "numberValidator",
  content: "contentValidator"
};

function getValidator(constraintName) {
  return validators[validatorsByConstraint[constraintName]] || validators.noopValidator;
}

function updateContentTargetVisibility(origin, constraint) {
  constraint.contentTargets.forEach(function (contentTarget) {
    var contentView = util.findNearestView(origin, "[data-lynx-name='" + contentTarget.name + "']");
    if (!contentView) return;
    var visibility = contentTarget.forState === constraint.state ? "visible" : "hidden";
    contentView.lynxSetVisibility(visibility);
  });
}

function addValidationExtensionsToView(view, validation) {
  exports.normalizeValidationConstraintSetObject(validation);

  if (view.matches("[data-lynx-input]")) {
    exports.addValidationExtensionsToInputView(view, validation);
  } else {
    exports.addValidationExtensionsToContainerView(view, validation);
  }

  view.lynxUpdateValidationContentVisibility = function () {
    exports.updateContentTargetVisibility(view, validation);
    validation.constraints.forEach(function (constraint) {
      return exports.updateContentTargetVisibility(view, constraint);
    });
  };
}

function resolveValidationStateOfDescendants(view) {
  var validatedViews = view.querySelectorAll("[data-lynx-validation-state]");
  var validationStates = Array.from(validatedViews).map(function (validatedView) {
    return validatedView.getAttribute("data-lynx-validation-state");
  });
  return exports.resolveValidationState(validationStates);
}

function validateContainer(view, validation) {
  validation.changes = [];

  validation.priorState = validation.state;
  validation.state = exports.resolveValidationStateOfDescendants(view);

  if (validation.state === validation.priorState) return;
  validation.changes.push(validation);
}

function addValidationExtensionsToContainerView(view, validation) {
  validation.state = exports.resolveValidationStateOfDescendants(view);
  view.setAttribute("data-lynx-validation-state", validation.state);

  view.lynxGetValidationState = function () {
    return view.getAttribute("data-lynx-validation-state");
  };

  view.addEventListener("lynx-validation-state-change", function (evt) {
    if (evt.target === view) return;
    exports.validateContainer(view, validation);

    if (validation.state !== validation.priorState) {
      view.setAttribute("data-lynx-validation-state", validation.state);
      exports.raiseValidationStateChangedEvent(view, validation);
      view.lynxUpdateValidationContentVisibility();
    }
  });

  view.addEventListener("input", function () {
    var validatedDescendants = view.querySelectorAll("[data-lynx-validation-state]");
    if (validatedDescendants.length > 0) return;
    exports.raiseValidatedEvent(view);
  });
}

function formatValue(formattedConstraint, value) {
  var regexp = validators.createRegExpForTextConstraintPattern(formattedConstraint.pattern);
  var formattedValue = value.replace(regexp, formattedConstraint.format);
  return formattedValue;
}

function addValidationExtensionsToInputView(view, validation) {
  function isFormattedConstraint(constraint) {
    return constraint.name === "text" && constraint.state === "valid" && "format" in constraint && "pattern" in constraint;
  }

  view.setAttribute("data-lynx-validation-state", validation.state);

  view.lynxGetValidationState = function () {
    return view.getAttribute("data-lynx-validation-state");
  };

  view.lynxGetValidationConstraintSetObject = function () {
    return validation;
  };

  view.lynxValidateValue = function () {
    var value = view.lynxGetValue();
    exports.validateValue(validation, value);

    if (validation.state !== validation.priorState) {
      view.setAttribute("data-lynx-validation-state", validation.state);
      exports.raiseValidationStateChangedEvent(view, validation);
    }

    if (validation.changes.length > 0) {
      view.lynxUpdateValidationContentVisibility();
      var formattedConstraint = validation.changes.find(isFormattedConstraint);
      if (formattedConstraint) view.lynxSetValue(exports.formatValue(formattedConstraint, view.lynxGetValue()));
    }

    exports.raiseValidatedEvent(view);
  };

  view.addEventListener("input", function () {
    view.lynxValidateValue();
  });
}

function validateValue(validation, value) {
  validation.changes = [];

  validation.constraints.forEach(function (constraint) {
    constraint.priorState = constraint.state;
    constraint.state = exports.getValidator(constraint.name)(constraint, value);
    if (constraint.state !== constraint.priorState) validation.changes.push(constraint);
  });

  validation.priorState = validation.state;
  validation.state = exports.resolveValidationState(validation.constraints.map(function (constraint) {
    return constraint.state;
  }));
  if (validation.state !== validation.priorState) validation.changes.push(validation);
}

function raiseValidationStateChangedEvent(view, validation) {
  var changeEvent = document.createEvent("Event");
  changeEvent.initEvent("lynx-validation-state-change", true, false);
  changeEvent.validation = validation;
  view.dispatchEvent(changeEvent);
}

function raiseValidatedEvent(view) {
  var validatedEvent = document.createEvent("Event");
  validatedEvent.initEvent("lynx-validated", true, false);
  view.dispatchEvent(validatedEvent);
}

function normalizeValidationConstraintSetObject(validation) {
  var initialConstraintStates = [];
  var initialConstraints = [];

  function normalizeContentTargets(constraint) {
    ["valid", "invalid", "unknown"].forEach(function (forState) {
      var name = constraint[forState];
      if (name) constraint.contentTargets.push({ forState: forState, name: name });
    });
  }

  Object.getOwnPropertyNames(validation).forEach(function (propertyName) {
    if (isValidationConstraintName(propertyName) === false) return;

    var constraints = validation[propertyName];
    if (!Array.isArray(constraints)) constraints = [constraints];

    constraints.forEach(function (constraint) {
      constraint.name = propertyName;
      constraint.state = constraint.state || "unknown";
      constraint.priorState = "";
      constraint.contentTargets = [];
      normalizeContentTargets(constraint);
      initialConstraintStates.push(constraint.state);
      initialConstraints.push(constraint);
    });
  });

  validation.state = exports.resolveValidationState(initialConstraintStates);
  validation.priorState = "";
  validation.constraints = initialConstraints;
  validation.contentTargets = [];
  normalizeContentTargets(validation);
}

function isValidationConstraintName(propertyName) {
  if (propertyName === "state") return false;
  if (propertyName === "valid") return false;
  if (propertyName === "invalid") return false;
  if (propertyName === "unknown") return false;
  return true;
}

function resolveValidationState(validationStates) {
  if (!Array.isArray(validationStates)) return "unknown";
  if (validationStates.indexOf("invalid") > -1) return "invalid";
  if (validationStates.indexOf("unknown") > -1) return "unknown";
  if (validationStates.indexOf("valid") > -1) return "valid";
  return "unknown";
}
},{"../../util":24,"./validators":18}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.noopValidator = noopValidator;
exports.requiredValidator = requiredValidator;
exports.createRegExpForTextConstraintPattern = createRegExpForTextConstraintPattern;
exports.textValidator = textValidator;
exports.numberValidator = numberValidator;
exports.typeMatchesTypeRange = typeMatchesTypeRange;
exports.contentValidator = contentValidator;
function noopValidator() {
  return "unknown";
}

function requiredValidator(constraint, value) {
  var valid = !(value === undefined || value === null || value === "" || Array.isArray(value) && value.length === 0);
  return valid ? "valid" : "invalid";
}

function createRegExpForTextConstraintPattern(pattern) {
  if (pattern.substring(0, 1) !== "^") pattern = "^" + pattern;
  if (pattern.substring(pattern.length - 1, 1) !== "$") pattern += "$";
  return new RegExp(pattern);
}

function textValidator(constraint, value) {
  var empty = value === undefined || value === null || value === "";

  if (empty) {
    return "valid";
  }

  if (constraint.minLength && value.length < constraint.minLength) {
    return "invalid";
  }

  if (constraint.maxLength && value.length > constraint.maxLength) {
    return "invalid";
  }

  if (constraint.pattern) {
    var regexp = createRegExpForTextConstraintPattern(constraint.pattern);
    if (!regexp) {
      return "unknown";
    } else if (regexp.test(value) === false) {
      return "invalid";
    }
  }

  return "valid";
}

function numberValidator(constraint, value) {
  var empty = value === undefined || value === null || value === "";

  if (empty) {
    return "valid";
  }

  if (isNaN(+value)) {
    return "invalid";
  }

  if (constraint.min && value < Number(constraint.min)) {
    return "invalid";
  }

  if (constraint.max && value > Number(constraint.max)) {
    return "invalid";
  }

  if (constraint.step && value % Number(constraint.step) !== 0) {
    return "invalid";
  }

  return "valid";
}

function typeMatchesTypeRange(actualType, expectedTypeRange) {
  expectedTypeRange = expectedTypeRange.split(";")[0].split("/");
  actualType = actualType.split(";")[0].split("/");
  if (expectedTypeRange[0] !== "*" && expectedTypeRange[0] !== actualType[0]) return false;
  if (expectedTypeRange[1] !== "*" && expectedTypeRange[1] !== actualType[1]) return false;
  return true;
}

function contentValidator(constraint, value) {
  var empty = value === null || value.length === 0;

  if (empty) {
    return "valid";
  }

  if (constraint.type) {
    var expectedTypeRanges = constraint.type;

    if (!Array.isArray(expectedTypeRanges)) {
      expectedTypeRanges = [expectedTypeRanges];
    }

    var matchesTypeRange = typeMatchesTypeRange.bind(null, value.type);

    if (!expectedTypeRanges.some(matchesTypeRange)) return "invalid";
  }

  if (constraint.maxLength && value.length > constraint.maxLength) {
    return "invalid";
  }

  return "valid";
}
},{}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registrations = undefined;
exports.register = register;
exports.build = build;
exports.documentViewBuilder = documentViewBuilder;

var _lynxParser = require("@lynx-json/lynx-parser");

var LYNX = _interopRequireWildcard(_lynxParser);

var _builders = require("../builders");

var builders = _interopRequireWildcard(_builders);

var _util = require("../util");

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var registrations = exports.registrations = [];

function register(hint, builder, condition) {
  if (!hint) throw new Error("'hint' param is required.");
  if (!builder) throw new Error("'builder' param is required.");
  if (condition && typeof condition !== "function") throw new Error("'condition' param must be a function.");

  var newRegistration = { hint: hint, builder: builder, condition: condition };
  var oldRegistration = registrations.find(function (registration) {
    return registration.hint === hint && registration.condition === condition;
  });

  if (oldRegistration) {
    var index = registrations.indexOf(oldRegistration);
    registrations[index] = newRegistration;
  } else {
    registrations.push(newRegistration);
  }
}

function build(content) {
  if (!content) return Promise.reject(new Error("'content' param is required."));
  if (!content.blob) return Promise.reject(new Error("'content' object must have a 'blob' property."));

  return new Promise(function (resolve, reject) {
    var fileReader = new FileReader();

    fileReader.onloadend = function (evt) {
      if (!evt) reject(new Error("'evt' param is required."));
      if (evt.target === undefined) reject(new Error("'evt' object must have a 'target' property."));
      if (evt.target.result === undefined) reject(new Error("'evt.target' object must have a 'result' property."));

      LYNX.parse(evt.target.result, { location: content.url, resolveSpecURL: util.resolveSpecFromUrl }).then(function (document) {
        content.options = content.options || {};
        content.options.document = document;
        return content;
      }).then(exports.documentViewBuilder).then(resolve, reject);
    };

    fileReader.readAsText(content.blob);
  });
}

function documentViewBuilder(content) {
  return Promise.resolve(content.options.document).then(builders.nodeViewBuilder).then(function (view) {
    if (content.options.startedAt) view.setAttribute("data-transfer-started-at", content.options.startedAt.valueOf());
    if (content.url) view.setAttribute("data-content-url", content.url);
    if (content.blob && content.blob.type) view.setAttribute("data-content-type", content.blob.type);
    if (content.options.document.realm) view.setAttribute("data-lynx-realm", content.options.document.realm);
    if (content.options.document.context) view.setAttribute("data-lynx-context", content.options.document.context);
    if (content.options.document.focus) view.setAttribute("data-lynx-focus", content.options.document.focus);
    return view;
  });
}
},{"../builders":9,"../util":24,"@lynx-json/lynx-parser":33}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.util = exports.attaching = exports.builders = exports.building = exports.transferring = undefined;

var _transferring = require("./transferring");

var transferring = _interopRequireWildcard(_transferring);

var _building = require("./building");

var building = _interopRequireWildcard(_building);

var _builders = require("./builders");

var builders = _interopRequireWildcard(_builders);

var _attaching = require("./attaching");

var attaching = _interopRequireWildcard(_attaching);

var _util = require("./util");

var util = _interopRequireWildcard(_util);

var _jsua = require("@lynx-json/jsua");

var jsua = _interopRequireWildcard(_jsua);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function isInput(node) {
  return !!node.spec.input;
}

building.register("container", builders.containerInputViewBuilder, isInput);
building.register("container", builders.containerViewBuilder);
building.register("form", builders.formViewBuilder);
building.register("content", builders.contentInputViewBuilder, isInput);
building.register("content", builders.contentViewBuilder);
building.register("image", builders.imageViewBuilder);
building.register("link", builders.linkViewBuilder);
building.register("submit", builders.submitViewBuilder);
building.register("text", builders.textInputViewBuilder, isInput);
building.register("text", builders.textViewBuilder);

// passthrough transferring/building for already parsed Lynx JSON documents via link and content `data`
jsua.transferring.register("lynx", transferring.transfer);
jsua.building.register("application/vnd.lynx-json.document", building.documentViewBuilder);

exports.transferring = transferring;
exports.building = building;
exports.builders = builders;
exports.attaching = attaching;
exports.util = util;
},{"./attaching":1,"./builders":9,"./building":19,"./transferring":23,"./util":24,"@lynx-json/jsua":29}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialize = initialize;

var _util = require("./util");

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function initialize(rootView) {
  rootView.addEventListener("jsua-attach", function () {
    var markerViews = Array.from(rootView.querySelectorAll("[data-lynx-marker-for]"));
    if (markerViews.length === 0) return;

    var contexts = Array.from(rootView.querySelectorAll("[data-content-url],[data-lynx-realm]")).reduce(function (acc, view) {
      if (view.hasAttribute("data-content-url")) acc.push(view.getAttribute("data-content-url"));
      if (view.hasAttribute("data-lynx-realm")) acc.push(view.getAttribute("data-lynx-realm"));
      return acc;
    }, []);

    markerViews.forEach(function (markerView) {
      var scope = markerView.getAttribute("data-lynx-marker-for");
      var oldWhere = markerView.getAttribute("data-lynx-marker-where");
      var newWhere = "there";

      if (contexts.some(function (context) {
        return util.scopeIncludesRealm(scope, context);
      })) newWhere = "here";
      if (oldWhere === newWhere) return;

      markerView.setAttribute("data-lynx-marker-where", newWhere);

      var changeEvent = document.createEvent("Event");
      var type = newWhere === "here" ? "lynx-marker-here" : "lynx-marker-there";
      changeEvent.initEvent(type, true, false);
      markerView.dispatchEvent(changeEvent);
    });
  });
}
},{"./util":24}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialize = initialize;

var _util = require("./util");

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function initialize(rootView) {
  rootView.addEventListener("jsua-attach", function (evt) {
    var inputViews = Array.from(rootView.querySelectorAll("[data-lynx-options-name]:not([data-lynx-options-connected])"));
    if (inputViews.length === 0) return;
    inputViews.forEach(function (inputView) {
      return inputView.lynxConnectOptions();
    });
  });
}
},{"./util":24}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transfer = transfer;
function transfer(request) {
  if (!request.options.document) throw new Error("The 'request.options.document' param must have a value of a parsed Lynx JSON document.");
  request.blob = new Blob([], { type: "application/vnd.lynx-json.document" });
  return Promise.resolve(request);
}
},{}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveSpecFromUrl = resolveSpecFromUrl;
exports.findNearestView = findNearestView;
exports.findNearestAncestorView = findNearestAncestorView;
exports.buildFormData = buildFormData;
exports.scopeIncludesRealm = scopeIncludesRealm;

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _jsua = require("@lynx-json/jsua");

var jsua = _interopRequireWildcard(_jsua);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function resolveSpecFromUrl(specUrl) {
  return new Promise(function (resolve, reject) {
    jsua.transferring.transfer({ url: specUrl }).then(function (content) {
      var reader = new FileReader();
      reader.addEventListener("loadend", function () {
        try {
          resolve(JSON.parse(reader.result));
        } catch (err) {
          reject(err);
        }
      });
      reader.readAsText(content.blob);
    }).catch(reject);
  });
}

function findNearestView(view, selector, predicate, origin) {
  function query() {
    var result = Array.from(view.querySelectorAll(selector));

    if (view !== origin && view.matches(selector)) {
      result.push(view);
    }

    return result;
  }

  if (!view || !selector || view.matches("[data-jsua-context~=app]")) return null;
  origin = origin || view;

  var matches = query();
  if (matches.length === 0) return findNearestView(view.parentElement, selector, predicate, origin);

  if (predicate) {
    var matching = matches.find(predicate);
    if (matching) return matching;
    return findNearestView(view.parentElement, selector, predicate, origin);
  }

  return matches[0];
}

function findNearestAncestorView(view, selector, predicate) {
  if (!view || !selector || view.matches("[data-jsua-context~=app]")) return null;
  var parent = view.parentElement;
  if (parent && parent.matches(selector) && (!predicate || predicate(parent))) return parent;
  return findNearestAncestorView(parent, selector, predicate);
}

function buildFormData(submitView) {
  var formView = exports.findNearestAncestorView(submitView, "[data-lynx-hints~=form]");
  if (!formView) return null;

  var formData;

  if (submitView.getAttribute("data-lynx-submit-enctype") === "multipart/form-data") {
    formData = new FormData();
  } else {
    formData = new URLSearchParams();
  }

  var inputViews = formView.querySelectorAll("[data-lynx-input]:not([data-lynx-hints~=container])");

  Array.from(inputViews).forEach(function (inputView) {
    var inputValues = inputView.lynxGetValue();
    if (!Array.isArray(inputValues)) inputValues = [inputValues];

    inputValues.forEach(function (inputValue) {
      formData.append(inputView.getAttribute("data-lynx-input"), inputValue);
    });
  });

  return formData;
}

function scopeIncludesRealm(scope, realm) {
  if (!scope || !realm) return false;
  scope = _url2.default.parse(scope).href;
  realm = _url2.default.parse(realm).href;
  return realm.indexOf(scope) === 0;
}
},{"@lynx-json/jsua":29,"url":44}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attach = attach;
exports.raiseAttachDetachEvent = raiseAttachDetachEvent;
exports.register = register;
var registrations = exports.registrations = [];

function attach(result) {
  if (!result) return Promise.reject(new Error("'result' param is required."));
  if (!result.view) return Promise.reject(new Error("'result' object must have 'view' property."));
  if (registrations.length === 0) return Promise.reject(new Error("No attachers have been registered."));

  return new Promise(function (resolve, reject) {
    var attachment = registrations.reduce(function (prev, registration) {
      if (prev) return prev;

      var attacherResult = registration.attacher(result);
      if (!attacherResult) return;

      return {
        registration: registration,
        result: attacherResult
      };
    }, null);

    if (!attachment) {
      return reject(new Error("No attachment available for view."));
    }

    if (attachment.result.discard) {
      var err = new Error("The view was discarded by '" + attachment.registration.name + "'.");
      err.name = "ViewDiscardedError";
      return reject(err);
    }

    var detachedViews = attachment.result.attach();

    if (detachedViews) {
      detachedViews.forEach(function (detachedView) {
        exports.raiseAttachDetachEvent(detachedView, "jsua-detach", false);
        Array.from(detachedView.querySelectorAll("*")).forEach(function (detachedSubview) {
          exports.raiseAttachDetachEvent(detachedSubview, "jsua-detach", false);
        });
      });
    }

    Array.from(result.view.querySelectorAll("*")).forEach(function (attachedSubview) {
      exports.raiseAttachDetachEvent(attachedSubview, "jsua-attach", false);
    });

    exports.raiseAttachDetachEvent(result.view, "jsua-attach", true);

    resolve(result);
  });
}

function raiseAttachDetachEvent(view, type, bubbles) {
  var changeEvent = document.createEvent("Event");
  changeEvent.initEvent(type, bubbles, false);
  view.dispatchEvent(changeEvent);
}

function register(name, attacher) {
  if (!name) throw new Error("'name' param is required.");
  if (!attacher) throw new Error("'attacher' param is required.");

  var newRegistration = { name: name, attacher: attacher };
  var oldRegistration = registrations.find(function (registration) {
    return registration.name === name;
  });

  if (oldRegistration) {
    var index = registrations.indexOf(oldRegistration);
    registrations[index] = newRegistration;
  } else {
    registrations.push(newRegistration);
  }
}
},{}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registrations = undefined;
exports.build = build;
exports.register = register;

var _createMediaTypePredicate = require("./create-media-type-predicate");

var _createMediaTypePredicate2 = _interopRequireDefault(_createMediaTypePredicate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var registrations = exports.registrations = [];

function build(content) {
  if (!content) return Promise.reject(new Error("'content' param is required."));
  if (!content.blob) return Promise.reject(new Error("'content' object must have a 'blob' property."));
  if ("type" in content.blob === false) return Promise.reject(new Error("'content.blob' object must have a 'type' property."));
  if (registrations.length === 0) return Promise.reject(new Error("No builders have been registered."));

  var type = content.blob.type || "application/octet-stream";
  var registration = registrations.find(function (registration) {
    return registration.predicate(type);
  });
  if (!registration) return Promise.reject(new Error("No builder registered for content type '" + type + "'"));

  return registration.builder(content).then(function (view) {
    return {
      content: content,
      view: view
    };
  });
}

function register(mediaType, builder) {
  if (!mediaType) throw new Error("'mediaType' param is required.");
  if (!builder) throw new Error("'builder' param is required.");

  var newRegistration = { mediaType: mediaType, builder: builder, predicate: (0, _createMediaTypePredicate2.default)(mediaType) };
  var oldRegistration = registrations.find(function (registration) {
    return registration.mediaType === mediaType;
  });

  if (oldRegistration) {
    var index = registrations.indexOf(oldRegistration);
    registrations[index] = newRegistration;
  } else {
    registrations.push(newRegistration);
  }

  var sorted = registrations.sort(function (x, y) {
    return x.predicate.specificity < y.predicate.specificity;
  });
  Array.prototype.splice.call(registrations, [0, registrations.length], sorted);
}
},{"./create-media-type-predicate":27}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createMediaTypePredicate;
var SPECIFICITY_TYPE_RANGE = 0;
var SPECIFICITY_SUBTYPE_RANGE = 1;
var SPECIFICITY_MEDIA_TYPE = 2;

function createMediaTypePredicate(mediaType) {
  if (!mediaType) throw new Error("'mediaType' param is required.");

  if (mediaType === "*/*") {
    var _predicate = function _predicate() {
      return true;
    };
    _predicate.specificity = SPECIFICITY_TYPE_RANGE;
    return _predicate;
  }

  var rangePattern = /^([a-zA-Z0-9][a-zA-Z0-9!#$&-^_.+]*)\/\*(;|$)/;
  var mediaTypePattern = /^([a-zA-Z0-9][a-zA-Z0-9!#$&-^_.+]*)\/([a-zA-Z0-9\!\#\$\&\^\_\.\+\-]*)(;|$)/;

  var rangePatternMatch = rangePattern.exec(mediaType);
  if (rangePatternMatch) {
    var _predicate2 = function _predicate2(contentType) {
      var contentTypeMatch = mediaTypePattern.exec(contentType);
      if (!contentTypeMatch) return false;
      return contentTypeMatch[1] === rangePatternMatch[1];
    };

    _predicate2.specificity = SPECIFICITY_SUBTYPE_RANGE;

    return _predicate2;
  }

  var mediaTypeMatch = mediaTypePattern.exec(mediaType);
  if (!mediaTypeMatch) throw new Error("Unable to parse media type '" + mediaType + "'");

  var type = mediaTypeMatch[1];
  var subtype = mediaTypeMatch[2];

  var predicate = function predicate(contentType) {
    var contentTypeMatch = mediaTypePattern.exec(contentType);
    if (!contentTypeMatch) return false;
    return contentTypeMatch[1] === type && contentTypeMatch[2] === subtype;
  };

  predicate.specificity = SPECIFICITY_MEDIA_TYPE;

  return predicate;
}
},{}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;
exports.finish = finish;
exports.tryToSetFocus = tryToSetFocus;
exports.setFocus = setFocus;
var registrations = exports.registrations = [];

function register(name, finisher, condition) {
  if (!name) throw new Error("'name' param is required.");
  if (!finisher) throw new Error("'finisher' param is required.");
  if (typeof finisher !== "function" && Array.isArray(finisher) === false) throw new Error("'finisher' param must be a function or array.");
  if (condition && typeof condition !== "function") throw new Error("'condition' param must be a function.");

  if (typeof finisher === "function") finisher = [finisher];
  condition = condition || null;
  var newRegistration = { name: name, finisher: finisher, condition: condition };
  var oldRegistration = registrations.find(function (registration) {
    return registration.name === name;
  });

  if (oldRegistration) {
    var index = registrations.indexOf(oldRegistration);
    registrations[index] = newRegistration;
  } else {
    registrations.push(newRegistration);
  }
}

function finish(result) {
  if (!result) throw new Error("'result' param is required.");
  if (!result.view) throw new Error("'result' object must have 'view' property.");
  if (!result.content) throw new Error("'result' object must have 'content' property.");

  registrations.forEach(function (registration) {
    if (registration.condition && registration.condition(result) === false) return;

    registration.finisher.forEach(function (finisher) {
      try {
        finisher(result);
      } catch (e) {
        console.log("A non-critical error occurred in jsua/finishing for registrant '" + registration.name + "'.", e);
      }
    });
  });

  exports.tryToSetFocus(result);

  return result;
}

function tryToSetFocus(result) {
  var focusedViews = Array.from(result.view.querySelectorAll("[data-jsua-focus=true]"));
  if (result.view.matches("[data-jsua-focus=true]")) focusedViews.unshift(result.view);

  focusedViews.forEach(function (focusedView, idx) {
    focusedView.removeAttribute("data-jsua-focus");
    if (idx !== 0) return;
    exports.setFocus(focusedView);
  });
}

function setFocus(view) {
  view.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  view.focus();
}
},{}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.finishing = exports.attaching = exports.building = exports.transferring = exports.fetch = undefined;

var _transferring = require("./transferring");

var transferring = _interopRequireWildcard(_transferring);

var _building = require("./building");

var building = _interopRequireWildcard(_building);

var _attaching = require("./attaching");

var attaching = _interopRequireWildcard(_attaching);

var _finishing = require("./finishing");

var finishing = _interopRequireWildcard(_finishing);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function fetch(url, options) {
  options = options || {};
  var appView = findAppViewFor(options.origin);
  var urlObj = _url2.default.parse(url);

  if (isSameDocumentReference(appView, urlObj, options)) {
    var sameDocumentReferenceView = findSameDocumentReferenceView(appView, urlObj, options);
    if (sameDocumentReferenceView) {
      if (sameDocumentReferenceView === appView) {
        scrollAppViewToTop(appView);
      } else {
        sameDocumentReferenceView.setAttribute("data-jsua-focus", true);
        finishing.tryToSetFocus({ view: sameDocumentReferenceView });
      }

      return Promise.resolve({ view: sameDocumentReferenceView });
    }

    return Promise.resolve({ view: appView });
  }

  return Promise.resolve({ url: url, options: options }).then(transferring.transfer).then(building.build).then(attaching.attach).then(finishing.finish);
}

function isSameDocumentReference(appView, urlObj, options) {
  if (!appView) return false;
  if (!urlObj.hash) return false;

  return Array.from(appView.querySelectorAll("[data-content-url]")).map(function (el) {
    return el.getAttribute("data-content-url");
  }).some(variesByFragmentOnly(urlObj));
}

function variesByFragmentOnly(urlObj) {
  return function (otherUrl) {
    if (!otherUrl) return false;

    var otherUrlObj = _url2.default.parse(otherUrl);
    return otherUrlObj.protocol === urlObj.protocol && otherUrlObj.host === urlObj.host && otherUrlObj.path === urlObj.path;
  };
}

function findSameDocumentReferenceView(appView, urlObj, options) {
  if (urlObj.hash === "#") return appView;
  return appView.querySelector("[data-jsua-view-uri='" + urlObj.href + "']");
}

function scrollAppViewToTop(appView) {
  var firstScrollableView = Array.from(appView.querySelectorAll("*")).find(function (el) {
    return el.style.overflowY === "scroll";
  });

  if (firstScrollableView) {
    firstScrollableView.scrollTop = 0;
  }
}

function findAppViewFor(view) {
  if (!view) return;

  var current = view;

  while (current && current.matches("[data-jsua-context~=app]") === false) {
    current = current.parentElement;
  }

  return current;
}

transferring.register("https", transferring.http);
transferring.register("http", transferring.http);
transferring.register("data", transferring.data);

exports.fetch = fetch;
exports.transferring = transferring;
exports.building = building;
exports.attaching = attaching;
exports.finishing = finishing;
},{"./attaching":25,"./building":26,"./finishing":28,"./transferring":32,"url":44}],30:[function(require,module,exports){
(function (Buffer){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transfer;
function transfer(request) {
  var url = request.url.replace("data:", "");
  var delim = url.indexOf(",");
  var type, encoding;

  if (delim === 0) {
    type = "text/plain;charset=US-ASCII";
    encoding = "ascii";
  } else {
    type = url.substr(0, delim);
    if (type.indexOf(";base64") !== -1) {
      encoding = "base64";
      type = type.replace(";base64", "");
    }
  }

  var content = url.substr(delim + 1);
  encoding = encoding || "utf8";

  if (encoding === "utf8") {
    content = decodeURIComponent(content);
  }

  var data = new Buffer(content, encoding);
  request.blob = new Blob([data], { type: type });

  return Promise.resolve(request);
}
}).call(this,require("buffer").Buffer)
},{"buffer":35}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transfer;
function transfer(request) {
  return fetch(request.url, request.options).then(function (response) {
    return response.blob();
  }).then(function (blob) {
    request.blob = blob;
    return request;
  });
}
},{}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.data = exports.http = exports.registrations = undefined;
exports.addEventListener = addEventListener;
exports.removeEventListener = removeEventListener;
exports.transfer = transfer;
exports.raiseTransferringStartedEvent = raiseTransferringStartedEvent;
exports.raiseTransferringEndedEvent = raiseTransferringEndedEvent;
exports.raiseTransferringErrorEvent = raiseTransferringErrorEvent;
exports.register = register;

var _url = require("url");

var urlModule = _interopRequireWildcard(_url);

var _http = require("./http");

var _http2 = _interopRequireDefault(_http);

var _data = require("./data");

var _data2 = _interopRequireDefault(_data);

var _events = require("events");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var pendingTransfers = 0;
var eventHub = new _events.EventEmitter();

function incrementPendingTransfers() {
  return ++pendingTransfers;
}

function decrementPendingTransfers() {
  return --pendingTransfers;
}

var registrations = exports.registrations = [];

function addEventListener(eventName, listener) {
  eventHub.addListener(eventName, listener);
}

function removeEventListener(eventName, listener) {
  eventHub.removeListener(eventName, listener);
}

function transfer(request) {
  if (!request) return Promise.reject(new Error("'request' param is required."));
  if (!request.url) return Promise.reject(new Error("'request' object must have 'url' property."));
  if (registrations.length === 0) return Promise.reject(new Error("No transferrers have been registered."));

  var url = request.url;
  request.options = request.options || {};
  request.options.startedAt = new Date();
  var protocol = urlModule.parse(url).protocol;
  if (!protocol) return Promise.reject(new Error("'request.url' param must have a protocol scheme."));

  protocol = protocol.replace(":", "");
  var registration = registrations.find(function (registration) {
    return registration.protocol === protocol;
  });
  if (!registration) return Promise.reject(new Error("No transferrer registered for protocol: " + protocol));

  exports.raiseTransferringStartedEvent(request);

  return registration.transferrer(request).then(function (result) {
    exports.raiseTransferringEndedEvent(request, result);
    return result;
  }).catch(function (err) {
    exports.raiseTransferringErrorEvent(request, err);
    throw err;
  });
}

function raiseTransferringStartedEvent(request) {
  var countOfPendingTransfers = incrementPendingTransfers();

  var eventObj = {
    request: request,
    pendingTransfers: countOfPendingTransfers
  };

  eventHub.emit("start", eventObj);
}

function raiseTransferringEndedEvent(request, result) {
  var countOfPendingTransfers = decrementPendingTransfers();

  var eventObj = {
    request: request,
    pendingTransfers: countOfPendingTransfers,
    result: result
  };

  eventHub.emit("end", eventObj);
}

function raiseTransferringErrorEvent(request, err) {
  var countOfPendingTransfers = decrementPendingTransfers();

  var eventObj = {
    request: request,
    pendingTransfers: countOfPendingTransfers,
    error: err
  };

  eventHub.emit("error", eventObj);
}

function register(protocol, transferrer) {
  if (!protocol) throw new Error("'protocol' param is required.");
  if (!transferrer) throw new Error("'transferrer' param is required.");

  var newRegistration = { protocol: protocol, transferrer: transferrer };
  var oldRegistration = registrations.find(function (registration) {
    return registration.protocol === protocol;
  });

  if (oldRegistration) {
    var index = registrations.indexOf(oldRegistration);
    registrations[index] = newRegistration;
  } else {
    registrations.push(newRegistration);
  }
}

exports.http = _http2.default;
exports.data = _data2.default;
},{"./data":30,"./http":31,"events":37,"url":44}],33:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var util = require("util");
var reservedKeys = ["spec", "value", "realm", "base", "focus", "context"];
var preservedKeysForEmbedments = ["realm", "base", "focus", "context"];
var contentType = require("content-type");
var url = require("url");

function matchesName(name) {
  return function (item) {
    return item.name === name;
  };
}

function assignPropertyValue(obj, property) {
  return function (value) {
    obj[property] = value;
    return value;
  };
}

exports.parse = function (content, options) {
  function prepareSpec(spec) {
    if (typeof spec === "string") {
      if (!options.resolveSpecURL) return Promise.reject(new Error("You must provide a resolveSpecURL function as an option."));
      spec = url.resolve(base, spec);
      return options.resolveSpecURL(spec);
    } else {
      return Promise.resolve(spec);
    }
  }

  function prepareNode(source, templateSpec) {
    var node = {};
    var spec = source && source.spec || templateSpec;

    function prepareValue(rspec) {
      if (templateSpec && (typeof templateSpec === "undefined" ? "undefined" : _typeof(templateSpec)) === "object") {
        node.spec = Object.assign({}, templateSpec, rspec);
      } else {
        node.spec = rspec;
      }

      var value = source === null || source.value === undefined ? source : source.value;

      if (util.isArray(value)) node.value = [];else if (util.isObject(value)) node.value = {};else node.value = value;

      var childPromises = [];

      if (util.isObject(value)) {
        for (var p in value) {
          if (reservedKeys.indexOf(p) !== -1) continue;

          var _spec = util.isArray(node.spec.children) ? node.spec.children.find(matchesName(p)) : node.spec.children;

          if (_spec || util.isArray(value)) {
            childPromises.push(prepareNode(value[p], _spec).then(assignPropertyValue(node.value, p)));
          } else if (p === "data" && value[p] !== null && _typeof(value[p]) === "object" && value.type && value.type.indexOf("application/lynx+json") > -1) {
            childPromises.push(prepareNode(value[p]).then(assignPropertyValue(node.value, p)).then(appendEmbedment(value[p])));
          } else {
            node.value[p] = value[p];
          }
        }
      }

      return Promise.all(childPromises).then(function () {
        return node;
      });
    }

    return prepareSpec(spec).then(prepareValue);
  }

  function appendEmbedment(rawValue) {
    return function (embedment) {
      embedment.embedded = true;

      preservedKeysForEmbedments.forEach(function (p) {
        if (p in rawValue) embedment[p] = rawValue[p];
      });

      embedments.push(embedment);
      return embedment;
    };
  }

  var embedments = [];
  var type = contentType.parse(options && options.type || "application/lynx+json");
  var rawDocument = JSON.parse(content);
  var base = rawDocument.base || type.parameters.base || options && options.location;
  var realm = rawDocument.realm || type.parameters.realm;

  function assignDocumentProperties(doc) {
    if (realm) {
      doc.realm = doc.realm || realm;
    }

    if (base) {
      doc.base = doc.base || base;
    }

    if (!doc.embedded && rawDocument.context) {
      doc.context = rawDocument.context;
    }

    if (!doc.embedded && rawDocument.focus) {
      doc.focus = rawDocument.focus;
    }

    return doc;
  }

  return prepareNode(rawDocument).then(function (doc) {
    embedments.forEach(assignDocumentProperties);
    return assignDocumentProperties(doc);
  });
};
},{"content-type":36,"url":44,"util":48}],34:[function(require,module,exports){
'use strict'

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

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],35:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

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

  if (isArrayBuffer(value)) {
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
    throw new TypeError('"size" argument must be a number')
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
    throw new TypeError('"encoding" must be a valid string encoding')
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
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
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
    if (isArrayBufferView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
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
  if (isArrayBufferView(string) || isArrayBuffer(string)) {
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

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
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

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

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
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
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
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
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

// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
function isArrayBufferView (obj) {
  return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":34,"ieee754":38}],36:[function(require,module,exports){
/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
 *
 * parameter     = token "=" ( token / quoted-string )
 * token         = 1*tchar
 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *               / DIGIT / ALPHA
 *               ; any VCHAR, except delimiters
 * quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
 * qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
 * obs-text      = %x80-FF
 * quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
 */
var PARAM_REGEXP = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g
var TEXT_REGEXP = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/
var TOKEN_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/

/**
 * RegExp to match quoted-pair in RFC 7230 sec 3.2.6
 *
 * quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
 * obs-text    = %x80-FF
 */
var QESC_REGEXP = /\\([\u000b\u0020-\u00ff])/g

/**
 * RegExp to match chars that must be quoted-pair in RFC 7230 sec 3.2.6
 */
var QUOTE_REGEXP = /([\\"])/g

/**
 * RegExp to match type in RFC 7231 sec 3.1.1.1
 *
 * media-type = type "/" subtype
 * type       = token
 * subtype    = token
 */
var TYPE_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/

/**
 * Module exports.
 * @public
 */

exports.format = format
exports.parse = parse

/**
 * Format object to media type.
 *
 * @param {object} obj
 * @return {string}
 * @public
 */

function format (obj) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('argument obj is required')
  }

  var parameters = obj.parameters
  var type = obj.type

  if (!type || !TYPE_REGEXP.test(type)) {
    throw new TypeError('invalid type')
  }

  var string = type

  // append parameters
  if (parameters && typeof parameters === 'object') {
    var param
    var params = Object.keys(parameters).sort()

    for (var i = 0; i < params.length; i++) {
      param = params[i]

      if (!TOKEN_REGEXP.test(param)) {
        throw new TypeError('invalid parameter name')
      }

      string += '; ' + param + '=' + qstring(parameters[param])
    }
  }

  return string
}

/**
 * Parse media type to object.
 *
 * @param {string|object} string
 * @return {Object}
 * @public
 */

function parse (string) {
  if (!string) {
    throw new TypeError('argument string is required')
  }

  // support req/res-like objects as argument
  var header = typeof string === 'object'
    ? getcontenttype(string)
    : string

  if (typeof header !== 'string') {
    throw new TypeError('argument string is required to be a string')
  }

  var index = header.indexOf(';')
  var type = index !== -1
    ? header.substr(0, index).trim()
    : header.trim()

  if (!TYPE_REGEXP.test(type)) {
    throw new TypeError('invalid media type')
  }

  var obj = new ContentType(type.toLowerCase())

  // parse parameters
  if (index !== -1) {
    var key
    var match
    var value

    PARAM_REGEXP.lastIndex = index

    while ((match = PARAM_REGEXP.exec(header))) {
      if (match.index !== index) {
        throw new TypeError('invalid parameter format')
      }

      index += match[0].length
      key = match[1].toLowerCase()
      value = match[2]

      if (value[0] === '"') {
        // remove quotes and escapes
        value = value
          .substr(1, value.length - 2)
          .replace(QESC_REGEXP, '$1')
      }

      obj.parameters[key] = value
    }

    if (index !== header.length) {
      throw new TypeError('invalid parameter format')
    }
  }

  return obj
}

/**
 * Get content-type from req/res objects.
 *
 * @param {object}
 * @return {Object}
 * @private
 */

function getcontenttype (obj) {
  var header

  if (typeof obj.getHeader === 'function') {
    // res-like
    header = obj.getHeader('content-type')
  } else if (typeof obj.headers === 'object') {
    // req-like
    header = obj.headers && obj.headers['content-type']
  }

  if (typeof header !== 'string') {
    throw new TypeError('content-type header is missing from object')
  }

  return header
}

/**
 * Quote a string if necessary.
 *
 * @param {string} val
 * @return {string}
 * @private
 */

function qstring (val) {
  var str = String(val)

  // no need to quote tokens
  if (TOKEN_REGEXP.test(str)) {
    return str
  }

  if (str.length > 0 && !TEXT_REGEXP.test(str)) {
    throw new TypeError('invalid parameter value')
  }

  return '"' + str.replace(QUOTE_REGEXP, '\\$1') + '"'
}

/**
 * Class to represent a content type.
 * @private
 */
function ContentType (type) {
  this.parameters = Object.create(null)
  this.type = type
}

},{}],37:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],38:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
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
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

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
  var eLen = nBytes * 8 - mLen - 1
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
      m = (value * c - 1) * Math.pow(2, mLen)
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

},{}],39:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],40:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],41:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],42:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],43:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":41,"./encode":42}],44:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":45,"punycode":40,"querystring":43}],45:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],46:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],47:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],48:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":47,"_process":39,"inherits":46}],49:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateFromBanner = updateFromBanner;
var primary = exports.primary = 'Indigo';
var secondary = exports.secondary = 'Yellow';

function updateFromBanner() {
  return function (banner) {
    exports.primary = primary = banner.getAttribute('data-lynx-var-primaryColor');
    exports.secondary = secondary = banner.getAttribute('data-lynx-var-secondaryColor');
  };
}

},{}],50:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jsuaStyle = require('@lynx-json/jsua-style');

var style = _interopRequireWildcard(_jsuaStyle);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var lynx = require('@lynx-json/jsua-lynx');


function isLabelFor(name) {
  return function (element) {
    return style.hasToken(element, "data-jsua-label-for", name);
  };
}

function isPage() {
  return function (el) {
    return el.parentElement.matches('[data-jsua-context~=app]') && el.matches('[data-lynx-hints~=container], [data-lynx-hints~=form]') && !el.matches('[data-lynx-hints~=set], [data-lynx-hints~=group], [data-lynx-hints~=list], [data-lynx-hints~=table]');
  };
}

exports.default = Object.assign({
  isLabelFor: isLabelFor,
  isPage: isPage,
  isInContext: function isInContext(name) {
    return '[data-jsua-context~=' + name + '] *';
  },
  isApplicationRoot: function isApplicationRoot() {
    return function (el) {
      return el.parentElement.matches('[data-jsua-context~=app]');
    };
  },
  hasStandingLine: function hasStandingLine() {
    return function (el) {
      return el.hasAttribute("data-jsua-material-standing-line");
    };
  },
  shouldNegateContainerPadding: function shouldNegateContainerPadding() {
    return function (el) {
      return el.hasAttribute('data-jsua-material-negate-padding');
    };
  }
}, style.filters);

},{"@lynx-json/jsua-lynx":20,"@lynx-json/jsua-style":98}],51:[function(require,module,exports){
'use strict';

var _jsuaStyle = require('@lynx-json/jsua-style');

var _filters = require('./filters');

var _filters2 = _interopRequireDefault(_filters);

var _mappers = require('./mappers');

var _mappers2 = _interopRequireDefault(_mappers);

var _styles = require('./styles');

var styles = _interopRequireWildcard(_styles);

var _util = require('./util');

var _jsuaMaterial = require('@lynx-json/jsua-material');

var material = _interopRequireWildcard(_jsuaMaterial);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var jsua = window.jsua || require('@lynx-json/jsua');


jsua.finishing.register('jsua-styling-example', function stylesheet(result) {
  (0, _jsuaStyle.query)(result.view).each([(0, _jsuaStyle.select)(_filters2.default.unlocked('[data-lynx-hints~=banner]'), (0, _util.lockStyle)('banner', styles.banner())), (0, _jsuaStyle.select)('[data-lynx-visibility=concealed], [data-lynx-visibility=revealed]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked('[data-lynx-hints~=set]'), (0, _util.lockStyle)('concealed-revealed-set', styles.expansionPanel.set())), (0, _jsuaStyle.filter)(_filters2.default.unlocked('[data-lynx-hints~=list]'), (0, _util.lockStyle)('concealed-revealed-list', styles.expansionPanel.list())), (0, _jsuaStyle.filter)(_filters2.default.unlocked('[data-lynx-hints~=group]'), (0, _util.lockStyle)('concealed-revealed-group', styles.expansionPanel.group())), (0, _jsuaStyle.filter)(_filters2.default.unlocked('[data-lynx-hints~=complement]'), (0, _util.lockStyle)('concealed-revealed-complement', styles.expansionPanel.complement())), (0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('concealed-revealed', styles.expansionPanel.container()))]),

  // General Styling
  (0, _jsuaStyle.filter)(_filters2.default.isApplicationRoot(), styles.body()), (0, _jsuaStyle.filter)(_filters2.default.isPage(), (0, _util.lockStyle)('page', styles.page())), (0, _jsuaStyle.select)('[data-lynx-hints~=complement]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('complement', styles.complement()))]), (0, _jsuaStyle.select)('[data-lynx-hints~=table]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('table', styles.table()))]), (0, _jsuaStyle.select)('[data-lynx-hints~=header]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(_filters2.default.has(_mappers2.default.realParent('[data-lynx-hints~=table]'))), (0, _util.lockStyle)('default-table-header', material.tableRow.auto())), (0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('header', material.header()))]), (0, _jsuaStyle.select)('[data-lynx-hints~=footer]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('footer', material.footer()))]), (0, _jsuaStyle.select)('[data-lynx-hints~=set]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('set', material.set.auto()))]), (0, _jsuaStyle.select)('[data-lynx-hints~=list]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('list', material.list()))]), (0, _jsuaStyle.select)('[data-lynx-hints~=group]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(_filters2.default.has(_mappers2.default.realParent('[data-lynx-hints~=table]'))), (0, _util.lockStyle)('default-table-row', material.tableRow.auto())), (0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('group', material.group()))]), (0, _jsuaStyle.select)('[data-lynx-hints~=card]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('card', material.card({ footerMapper: _mappers2.default.last(_mappers2.default.footers()) })))]), (0, _jsuaStyle.select)('[data-lynx-hints~=container], [data-lynx-hints~=form]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('container', material.container()))]), (0, _jsuaStyle.select)('[data-lynx-hints~=link], [data-lynx-hints~=submit]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('control', material.group({ alignItems: 'center', gap: '8px' })))]), (0, _jsuaStyle.select)('[data-lynx-hints~=text][data-lynx-input]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('text-input', styles.textInput()))]), (0, _jsuaStyle.select)('[data-lynx-hints~=label]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(_filters2.default.isLabelFor('page')), (0, _util.lockStyle)('label-page', material.text.headline())), (0, _jsuaStyle.filter)(_filters2.default.unlocked(_filters2.default.isLabelFor('text-input')), (0, _util.lockStyle)('label-text-input', material.text.caption())), (0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('label', material.text.subheading()))]), (0, _jsuaStyle.select)('[data-lynx-hints~=image]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked(), (0, _util.lockStyle)('image', styles.image()))]),

  // Selectables
  (0, _jsuaStyle.select)('[data-lynx-hints~=link], [data-lynx-hints~=submit]', [(0, _jsuaStyle.filter)(_filters2.default.unlocked('selectable', _filters2.default.isInContext('banner')), (0, _util.lockSelectable)('selectable-in-banner', styles.selectable.inBanner())), (0, _jsuaStyle.filter)(_filters2.default.unlocked('selectable', _filters2.default.isInContext('footer')), (0, _util.lockSelectable)('selectable-in-footer', material.flatButton({ color: 'Blue', labelMapper: _mappers2.default.label() }))), (0, _jsuaStyle.filter)(_filters2.default.unlocked('selectable', '*'), (0, _util.lockSelectable)('selectable', styles.selectable.highlightLabel()))]), _jsuaStyle.applyAdjustments]);
});

},{"./filters":50,"./mappers":52,"./styles":59,"./util":64,"@lynx-json/jsua":29,"@lynx-json/jsua-material":79,"@lynx-json/jsua-style":98}],52:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jsuaStyle = require('@lynx-json/jsua-style');

var style = _interopRequireWildcard(_jsuaStyle);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var lynx = require('@lynx-json/jsua-lynx');


function mapLabel(el) {
  var labeledBy = el.getAttribute('data-lynx-labeled-by');
  if (!labeledBy) return;

  var labelViewSelector = '[data-lynx-name=' + labeledBy + ']';
  return lynx.util.findNearestView(el, labelViewSelector);
}

exports.default = Object.assign({
  label: function label() {
    return mapLabel;
  },
  headers: function headers() {
    return style.mappers.realChildren('[data-lynx-hints~=header]', '[data-lynx-hints~=content]');
  },
  footers: function footers() {
    return style.mappers.realChildren('[data-lynx-hints~=footer]', '[data-lynx-hints~=content]');
  },
  realChildren: function realChildren(selector) {
    return style.mappers.realChildren(selector, '[data-lynx-hints~=content]');
  },
  realParent: function realParent(selector) {
    return style.mappers.realParent(selector, '[data-lynx-hints~=content]');
  }
}, style.mappers);

},{"@lynx-json/jsua-lynx":20,"@lynx-json/jsua-style":98}],53:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  all: "",
  smallScreen: "(max-width: 599px)",
  smallScreenPortrait: "(max-width: 599px) and (orientation: portrait)",
  smallScreenLandscape: "(max-width: 599px) and (orientation: landscape)",
  mediumScreen: "(min-width: 600px) and (max-width: 839px)",
  mediumScreenPortrait: "(min-width: 600px) and (max-width: 839px) and (orientation: portrait)",
  mediumScreenLandscape: "(min-width: 600px) and (max-width: 839px) and (orientation: landscape)",
  largeScreen: "(min-width: 840px)",
  largeScreenPortrait: "(min-width: 840px) and (orientation: portrait)",
  largeScreenLandscape: "(min-width: 840px) and (orientation: landscape)"
};

},{}],54:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = banner;

var _jsuaMaterial = require('@lynx-json/jsua-material');

var material = _interopRequireWildcard(_jsuaMaterial);

var _colors = require('../colors');

var colors = _interopRequireWildcard(_colors);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function banner() {
  return [colors.updateFromBanner(), function (el) {
    return material.background.primary({ backgroundColor: colors.primary })(el);
  },
  // TODO: Replace with contrast
  material.color({ color: 'White' }), material.header(), material.negateContainerPadding(), material.elevation.appBar(), function (el) {
    return el.style.position = 'sticky';
  }, function (el) {
    return el.style.top = '0px';
  }, material.padding.left('16px'), material.padding.right('16px'), function (el) {
    return el.style.minHeight = '64px';
  }];
}

},{"../colors":49,"@lynx-json/jsua-material":79}],55:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var theme = 'light';

  return [(0, _jsuaStyle.map)(function () {
    return document.body;
  }, [material.text(), material.background.main({ theme: theme }), material.color({ theme: theme })])];
};

var _jsuaMaterial = require('@lynx-json/jsua-material');

var material = _interopRequireWildcard(_jsuaMaterial);

var _jsuaStyle = require('@lynx-json/jsua-style');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

},{"@lynx-json/jsua-material":79,"@lynx-json/jsua-style":98}],56:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = complement;

var _jsuaMaterial = require('@lynx-json/jsua-material');

var material = _interopRequireWildcard(_jsuaMaterial);

var _colors = require('../colors');

var colors = _interopRequireWildcard(_colors);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function complement() {
  return [function (el) {
    return material.background.accent({ backgroundColor: colors.secondary, shade: 'A100' })(el);
  }, material.color({ color: 'Black', opacity: 0.54 }), material.card()];
}

},{"../colors":49,"@lynx-json/jsua-material":79}],57:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.complement = complement;
exports.set = set;
exports.group = group;
exports.list = list;
exports.container = container;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _mappers = require('../mappers');

var _mappers2 = _interopRequireDefault(_mappers);

var _jsuaMaterial = require('@lynx-json/jsua-material');

var material = _interopRequireWildcard(_jsuaMaterial);

var _colors = require('../colors');

var colors = _interopRequireWildcard(_colors);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function concealedExpansionPanel() {
  return [(0, _jsuaStyle.map)(_mappers2.default.children('[data-lynx-visibility-conceal]'), function (el) {
    return el.parentElement.removeChild(el);
  }), material.expansionPanel({ headerMapper: _mappers2.default.first(_mappers2.default.headers()) }), (0, _jsuaStyle.adjust)((0, _jsuaStyle.filter)('[data-lynx-visibility=revealed]', (0, _jsuaStyle.setState)('open')))];
}

function complement() {
  return [concealedExpansionPanel(), function (el) {
    return material.background.accent({ backgroundColor: colors.secondary, shade: 'A100' })(el);
  }, material.color({ color: 'Black', opacity: 0.54 }), material.container()];
}

function set() {
  return [concealedExpansionPanel(), material.set()];
}

function group() {
  return [concealedExpansionPanel(), material.group()];
}

function list() {
  return [concealedExpansionPanel(), material.list()];
}

function container() {
  return [concealedExpansionPanel(), material.container()];
}

},{"../colors":49,"../mappers":52,"@lynx-json/jsua-material":79,"@lynx-json/jsua-style":98}],58:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = image;

var _jsuaStyle = require("@lynx-json/jsua-style");

var _mappers = require("../mappers");

var _mappers2 = _interopRequireDefault(_mappers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function image() {
  return [(0, _jsuaStyle.map)(_mappers2.default.realChildren("img[data-lynx-embedded-view]"), [function (el) {
    return el.width = +el.getAttribute("data-lynx-width");
  }, function (el) {
    return el.height = +el.getAttribute("data-lynx-height");
  }]), (0, _jsuaStyle.when)("normal", function (el) {
    return el.style.display = "block";
  }), (0, _jsuaStyle.when)("visibility", "hidden", function (el) {
    return el.style.display = "none";
  }), (0, _jsuaStyle.setState)("normal")];
}

},{"../mappers":52,"@lynx-json/jsua-style":98}],59:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.page = exports.textInput = exports.table = exports.image = exports.complement = exports.expansionPanel = exports.selectable = exports.body = exports.banner = undefined;

var _banner = require('./banner');

var _banner2 = _interopRequireDefault(_banner);

var _body = require('./body');

var _body2 = _interopRequireDefault(_body);

var _selectable = require('./selectable');

var selectable = _interopRequireWildcard(_selectable);

var _expansionPanel = require('./expansion-panel');

var expansionPanel = _interopRequireWildcard(_expansionPanel);

var _complement = require('./complement');

var _complement2 = _interopRequireDefault(_complement);

var _image = require('./image');

var _image2 = _interopRequireDefault(_image);

var _table = require('./table');

var _table2 = _interopRequireDefault(_table);

var _textInput = require('./text-input');

var _textInput2 = _interopRequireDefault(_textInput);

var _page = require('./page');

var _page2 = _interopRequireDefault(_page);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.banner = _banner2.default;
exports.body = _body2.default;
exports.selectable = selectable;
exports.expansionPanel = expansionPanel;
exports.complement = _complement2.default;
exports.image = _image2.default;
exports.table = _table2.default;
exports.textInput = _textInput2.default;
exports.page = _page2.default;

},{"./banner":54,"./body":55,"./complement":56,"./expansion-panel":57,"./image":58,"./page":60,"./selectable":61,"./table":62,"./text-input":63}],60:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = page;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _jsuaMaterial = require('@lynx-json/jsua-material');

var material = _interopRequireWildcard(_jsuaMaterial);

var _mediaQueries = require('../media-queries');

var _mediaQueries2 = _interopRequireDefault(_mediaQueries);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function page() {
  return [material.container(), material.padding('16px'), (0, _jsuaStyle.media)(_mediaQueries2.default.all, [
  // TODO: This could have performance/memory implications because it calls adjust,
  // so each time a media query changes, another adjust function is called.
  material.padding.left('16px'), material.padding.right('16px')]), (0, _jsuaStyle.media)(_mediaQueries2.default.largeScreen, [material.padding.left('15vw'), material.padding.right('15vw')])];
}

},{"../media-queries":53,"@lynx-json/jsua-material":79,"@lynx-json/jsua-style":98}],61:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.highlightLabel = highlightLabel;
exports.inBanner = inBanner;

var _jsuaMaterial = require('@lynx-json/jsua-material');

var material = _interopRequireWildcard(_jsuaMaterial);

var _colors = require('../colors');

var colors = _interopRequireWildcard(_colors);

var _jsuaStyle = require('@lynx-json/jsua-style');

var _mappers = require('../mappers');

var _mappers2 = _interopRequireDefault(_mappers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function highlightLabel() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return [function (el) {
    return el.style.outline = 'none';
  }, function (el) {
    return el.style.cursor = 'pointer';
  }, (0, _jsuaStyle.when)('normal', [(0, _jsuaStyle.map)(_mappers2.default.label(), [function (el) {
    return el.style.fontWeight = 'normal';
  }, function (el) {
    return el.style.color = 'inherit';
  }, function (el) {
    return el.style.textDecoration = 'none';
  }])]), (0, _jsuaStyle.when)('selectable', [(0, _jsuaStyle.map)(_mappers2.default.label(), [function (el) {
    return el.style.fontWeight = 'normal';
  }, material.color({ color: colors.primary, shade: '700' })])]), (0, _jsuaStyle.when)('hover', function (el) {
    if (el.jsuaStyleHasState('selectable')) {
      (0, _jsuaStyle.map)(_mappers2.default.label(), [material.color({ color: colors.primary, shade: '900' }), function (el) {
        return el.style.textDecoration = 'underline';
      }])(el);
    }
  }), (0, _jsuaStyle.when)('active', function (el) {
    if (el.jsuaStyleHasState('selectable')) {
      (0, _jsuaStyle.map)(_mappers2.default.label(), [material.color({ color: colors.primary, shade: '900' }), function (el) {
        return el.style.textDecoration = 'underline';
      }])(el);
    }
  }), (0, _jsuaStyle.when)('selected', (0, _jsuaStyle.map)(_mappers2.default.label(), [function (el) {
    return el.style.color = 'inherit';
  }, function (el) {
    return el.style.fontWeight = 'bold';
  }])), (0, _jsuaStyle.on)('mouseover', (0, _jsuaStyle.setState)('hover')), (0, _jsuaStyle.on)('mouseout', (0, _jsuaStyle.clearState)('hover')), (0, _jsuaStyle.on)('mousedown', (0, _jsuaStyle.setState)('active')), (0, _jsuaStyle.on)('mouseup', (0, _jsuaStyle.clearState)('active')), (0, _jsuaStyle.setState)('normal')];
}

function inBanner() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return material.flatButton({ backgroundColor: colors.primary });
}

},{"../colors":49,"../mappers":52,"@lynx-json/jsua-material":79,"@lynx-json/jsua-style":98}],62:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = table;

var _jsuaMaterial = require('@lynx-json/jsua-material');

var material = _interopRequireWildcard(_jsuaMaterial);

var _colors = require('../colors');

var colors = _interopRequireWildcard(_colors);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function table() {
  return [material.table.auto(), material.color({ color: 'Black', opacity: 0.54 })];
}

},{"../colors":49,"@lynx-json/jsua-material":79}],63:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = table;

var _jsuaMaterial = require('@lynx-json/jsua-material');

var material = _interopRequireWildcard(_jsuaMaterial);

var _colors = require('../colors');

var colors = _interopRequireWildcard(_colors);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function table() {
  return [material.textInput({ theme: 'light', focusColor: colors.primary })];
}

},{"../colors":49,"@lynx-json/jsua-material":79}],64:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lockStyle = lockStyle;
exports.lockSelectable = lockSelectable;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _mappers = require('./mappers');

var _mappers2 = _interopRequireDefault(_mappers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lynx = require('@lynx-json/jsua-lynx');


function classifyLabel(name) {
  return (0, _jsuaStyle.map)(_mappers2.default.label(), function (el) {
    return (0, _jsuaStyle.addToken)(el, 'data-jsua-label-for', name);
  });
}

function lockStyle(name, fn) {
  return [(0, _jsuaStyle.lock)(), (0, _jsuaStyle.context)(name), classifyLabel(name), fn];
}

function lockSelectable(name, fn) {
  return [(0, _jsuaStyle.lock)('selectable'), (0, _jsuaStyle.context)(name), fn];
}

},{"./mappers":52,"@lynx-json/jsua-lynx":20,"@lynx-json/jsua-style":98}],65:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = background;

var _colorPalette = require("./color-palette");

var colorPalette = _interopRequireWildcard(_colorPalette);

var _util = require("./util");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function background() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.opacity = options.opacity || 1;
  return function (el) {
    var backgroundColor = options.backgroundColor;
    // TODO: Remove. Obsolete.
    if (typeof options.backgroundColor === 'function') {
      backgroundColor = options.backgroundColor();
    }
    el.style.backgroundColor = (0, _util.rgba)(colorPalette.getColor(backgroundColor, options.shade), options.opacity);
  };
}

background.primary = function primary() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.shade = options.shade || "500";
  return background(options);
};

background.accent = function accent() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.shade = options.shade || "A200";
  return background(options);
};

background.statusBar = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.theme = options.theme || "light";
  options.backgroundColor = options.backgroundColor || (options.theme === "light" ? colorPalette.getColor("Grey", 300) : colorPalette.getColor("Black"));
  return background(options);
};

background.appBar = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.theme = options.theme || "light";
  options.backgroundColor = options.backgroundColor || (options.theme === "light" ? colorPalette.getColor("Grey", 100) : colorPalette.getColor("Grey", 900));
  return background(options);
};

background.main = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.theme = options.theme || "light";
  options.backgroundColor = options.backgroundColor || (options.theme === "light" ? colorPalette.getColor("Grey", 50) : colorPalette.getColor("#303030"));
  return background(options);
};

background.card = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.theme = options.theme || "light";
  options.backgroundColor = options.backgroundColor || (options.theme === "light" ? colorPalette.getColor("White") : colorPalette.getColor("Grey", 800));
  return background(options);
};

background.menu = background.card;
background.dialog = background.card;
background.hover = background.appBar;
},{"./color-palette":68,"./util":92}],66:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = border;

var _colorPalette = require("./color-palette");

var colorPalette = _interopRequireWildcard(_colorPalette);

var _util = require("./util");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function getDividerColor(options) {
  var color = options.color;

  if (typeof color === 'function') {
    color = color();
  }

  if (color) {
    color = colorPalette.getColor(color);
  }

  options.theme = options.theme || "light";
  color = color || (options.theme === "light" ? "#000000" : "#FFFFFF");
  options.opacity = options.opacity || 0.12;

  return (0, _util.rgba)(color, options.opacity);
}

function border() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (el) {
    return el.style.border = (options.width || '1px') + " solid " + getDividerColor(options);
  };
}

border.top = function topBorder() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (el) {
    return el.style.borderTop = (options.width || '1px') + " solid " + getDividerColor(options);
  };
};

border.bottom = function bottomBorder() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (el) {
    return el.style.borderBottom = (options.width || '1px') + " solid " + getDividerColor(options);
  };
};

border.left = function leftBorder() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (el) {
    return el.style.borderLeft = (options.width || '1px') + " solid " + getDividerColor(options);
  };
};

border.right = function rightBorder() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (el) {
    return el.style.borderRight = (options.width || '1px') + " solid " + getDividerColor(options);
  };
};
},{"./color-palette":68,"./util":92}],67:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = expansionPanel;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _color = require('./color');

var _color2 = _interopRequireDefault(_color);

var _elevation = require('./elevation');

var _elevation2 = _interopRequireDefault(_elevation);

var _border = require('./border');

var _border2 = _interopRequireDefault(_border);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function expansionPanel() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.theme = options.theme || "light";

  var innerHTML = '\n    <div role="presentation" data-jsua-style-slot="content-wrapper">\n      <div data-jsua-style-slot="content" role="presentation"></div>\n    </div>\n    <div role="presentation" data-jsua-style-slot="footer-wrapper">\n      <div data-jsua-style-slot="footer" role="presentation"></div>\n      <div data-jsua-style-slot="toggle" role="presentation"><i role="presentation" class="material-icons">keyboard_arrow_down</i></div>\n    </div>\n  ';

  var maxHeight = 300;

  return [(0, _jsuaStyle.component)('material-card', innerHTML), (0, _jsuaStyle.slot)('footer', options.footerMapper), _elevation2.default.card(), function (el) {
    return el.style.display = 'flex';
  }, function (el) {
    return el.style.flexDirection = 'column';
  }, function (el) {
    return el.style.alignItems = 'stretch';
  }, function (el) {
    return el.style.justifyContent = 'space-between';
  }, function (el) {
    return el.style.borderRadius = '2px';
  }, (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('footer-wrapper'), [function (el) {
    return el.style.flexGrow = 0;
  }, function (el) {
    return el.style.cursor = 'default';
  }, function (el) {
    return el.style.display = 'flex';
  }, function (el) {
    return el.style.flexDirection = 'row';
  }, function (el) {
    return el.style.flexWrap = 'nowrap';
  }, function (el) {
    return el.style.alignItems = 'center';
  }, function (el) {
    return el.style.paddingLeft = '24px';
  }, function (el) {
    return el.style.paddingRight = '24px';
  }, function (el) {
    return el.style.minHeight = '48px';
  }, function (el) {
    return el.style.transition = 'min-height 175ms ease-in-out';
  }, (0, _jsuaStyle.on)('click', function (el, evt) {
    (0, _jsuaStyle.map)(_jsuaStyle.mappers.component(), (0, _jsuaStyle.toggleState)('open'))(el);
    evt.stopPropagation();
    evt.preventDefault();
  })]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('footer'), function (el) {
    return el.style.flexGrow = 1;
  }), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('toggle'), [function (el) {
    return el.style.display = 'flex';
  }, function (el) {
    return el.style.alignItems = 'center';
  }, function (el) {
    return el.style.marginLeft = '16px';
  }, (0, _color2.default)({ color: options.color, opacity: 0.38, theme: options.theme }), (0, _jsuaStyle.select)('i.material-icons', [function (el) {
    return el.style.width = '24px';
  }, function (el) {
    return el.style.height = '24px';
  }, function (el) {
    return el.style.overflow = 'hidden';
  }, function (el) {
    return el.style.cursor = 'default';
  }, function (el) {
    return el.style.borderRadius = '2px';
  }, (0, _jsuaStyle.when)('normal', function (el) {
    return el.style.border = '1px solid transparent';
  }), (0, _jsuaStyle.when)('hover', (0, _border2.default)(options)), (0, _jsuaStyle.on)('mouseenter', (0, _jsuaStyle.setState)('hover')), (0, _jsuaStyle.on)('mouseleave', (0, _jsuaStyle.clearState)('hover')), (0, _jsuaStyle.setState)('normal')])]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content-wrapper'), [function (el) {
    return el.style.flexGrow = 1;
  }, function (el) {
    return el.style.display = 'block';
  }, function (el) {
    return el.style.paddingLeft = '24px';
  }, function (el) {
    return el.style.paddingRight = '24px';
  }, function (el) {
    return el.style.transition = 'max-height 175ms ease-in-out';
  }, function (el) {
    return el.style.overflowY = 'hidden';
  }, function (el) {
    return el.style.overflowX = 'hidden';
  }]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), function (el) {
    return el.style.paddingTop = '16px';
  }), (0, _jsuaStyle.when)('normal', [(0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('footer-wrapper'), [function (el) {
    return el.style.minHeight = '48px';
  }]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('toggle'), [(0, _jsuaStyle.select)('i.material-icons', function (el) {
    return el.textContent = "keyboard_arrow_down";
  }), function (el) {
    return el.style.display = 'none';
  }]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content-wrapper'), [function (el) {
    return el.style.maxHeight = maxHeight + 'px';
  }])]), (0, _jsuaStyle.when)('open', [(0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('footer-wrapper'), [function (el) {
    return el.style.minHeight = '64px';
  }]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('toggle'), [(0, _jsuaStyle.select)('i.material-icons', function (el) {
    return el.textContent = "keyboard_arrow_up";
  })]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content-wrapper'), [function (el) {
    return el.style.maxHeight = el.firstElementChild.offsetHeight + 'px';
  }])]), (0, _jsuaStyle.when)('overflow', (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('toggle'), function (el) {
    return el.style.display = 'flex';
  })), (0, _jsuaStyle.adjust)([(0, _jsuaStyle.clearState)('overflow'), (0, _jsuaStyle.filter)(function (el) {
    return el.firstElementChild.firstElementChild.offsetHeight > maxHeight;
  }, [(0, _jsuaStyle.setState)('overflow')])]), (0, _jsuaStyle.setState)('normal')];
}
},{"./border":66,"./color":69,"./elevation":71,"@lynx-json/jsua-style":98}],68:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getColor = getColor;
var colors = {
  "Red": {
    "50": "#FFEBEE",
    "100": "#FFCDD2",
    "200": "#EF9A9A",
    "300": "#E57373",
    "400": "#EF5350",
    "500": "#F44336",
    "600": "#E53935",
    "700": "#D32F2F",
    "800": "#C62828",
    "900": "#B71C1C",
    "A100": "#FF8A80",
    "A200": "#FF5252",
    "A400": "#FF1744",
    "A700": "#D50000"
  },
  "Pink": {
    "50": "#FCE4EC",
    "100": "#F8BBD0",
    "200": "#F48FB1",
    "300": "#F06292",
    "400": "#EC407A",
    "500": "#E91E63",
    "600": "#D81B60",
    "700": "#C2185B",
    "800": "#AD1457",
    "900": "#880E4F",
    "A100": "#FF80AB",
    "A200": "#FF4081",
    "A400": "#F50057",
    "A700": "#C51162"
  },
  "Purple": {
    "50": "#F3E5F5",
    "100": "#E1BEE7",
    "200": "#CE93D8",
    "300": "#BA68C8",
    "400": "#AB47BC",
    "500": "#9C27B0",
    "600": "#8E24AA",
    "700": "#7B1FA2",
    "800": "#6A1B9A",
    "900": "#4A148C",
    "A100": "#EA80FC",
    "A200": "#E040FB",
    "A400": "#D500F9",
    "A700": "#AA00FF"
  },
  "Deep Purple": {
    "50": "#EDE7F6",
    "100": "#D1C4E9",
    "200": "#B39DDB",
    "300": "#9575CD",
    "400": "#7E57C2",
    "500": "#673AB7",
    "600": "#5E35B1",
    "700": "#512DA8",
    "800": "#4527A0",
    "900": "#311B92",
    "A100": "#B388FF",
    "A200": "#7C4DFF",
    "A400": "#651FFF",
    "A700": "#6200EA"
  },
  "Indigo": {
    "50": "#E8EAF6",
    "100": "#C5CAE9",
    "200": "#9FA8DA",
    "300": "#7986CB",
    "400": "#5C6BC0",
    "500": "#3F51B5",
    "600": "#3949AB",
    "700": "#303F9F",
    "800": "#283593",
    "900": "#1A237E",
    "A100": "#8C9EFF",
    "A200": "#536DFE",
    "A400": "#3D5AFE",
    "A700": "#304FFE"
  },
  "Blue": {
    "50": "#E3F2FD",
    "100": "#BBDEFB",
    "200": "#90CAF9",
    "300": "#64B5F6",
    "400": "#42A5F5",
    "500": "#2196F3",
    "600": "#1E88E5",
    "700": "#1976D2",
    "800": "#1565C0",
    "900": "#0D47A1",
    "A100": "#82B1FF",
    "A200": "#448AFF",
    "A400": "#2979FF",
    "A700": "#2962FF"
  },
  "Light Blue": {
    "50": "#E1F5FE",
    "100": "#B3E5FC",
    "200": "#81D4FA",
    "300": "#4FC3F7",
    "400": "#29B6F6",
    "500": "#03A9F4",
    "600": "#039BE5",
    "700": "#0288D1",
    "800": "#0277BD",
    "900": "#01579B",
    "A100": "#80D8FF",
    "A200": "#40C4FF",
    "A400": "#00B0FF",
    "A700": "#0091EA"
  },
  "Cyan": {
    "50": "#E0F7FA",
    "100": "#B2EBF2",
    "200": "#80DEEA",
    "300": "#4DD0E1",
    "400": "#26C6DA",
    "500": "#00BCD4",
    "600": "#00ACC1",
    "700": "#0097A7",
    "800": "#00838F",
    "900": "#006064",
    "A100": "#84FFFF",
    "A200": "#18FFFF",
    "A400": "#00E5FF",
    "A700": "#00B8D4"
  },
  "Teal": {
    "50": "#E0F2F1",
    "100": "#B2DFDB",
    "200": "#80CBC4",
    "300": "#4DB6AC",
    "400": "#26A69A",
    "500": "#009688",
    "600": "#00897B",
    "700": "#00796B",
    "800": "#00695C",
    "900": "#004D40",
    "A100": "#A7FFEB",
    "A200": "#64FFDA",
    "A400": "#1DE9B6",
    "A700": "#00BFA5"
  },
  "Green": {
    "50": "#E8F5E9",
    "100": "#C8E6C9",
    "200": "#A5D6A7",
    "300": "#81C784",
    "400": "#66BB6A",
    "500": "#4CAF50",
    "600": "#43A047",
    "700": "#388E3C",
    "800": "#2E7D32",
    "900": "#1B5E20",
    "A100": "#B9F6CA",
    "A200": "#69F0AE",
    "A400": "#00E676",
    "A700": "#00C853"
  },
  "Light Green": {
    "50": "#F1F8E9",
    "100": "#DCEDC8",
    "200": "#C5E1A5",
    "300": "#AED581",
    "400": "#9CCC65",
    "500": "#8BC34A",
    "600": "#7CB342",
    "700": "#689F38",
    "800": "#558B2F",
    "900": "#33691E",
    "A100": "#CCFF90",
    "A200": "#B2FF59",
    "A400": "#76FF03",
    "A700": "#64DD17"
  },
  "Lime": {
    "50": "#F9FBE7",
    "100": "#F0F4C3",
    "200": "#E6EE9C",
    "300": "#DCE775",
    "400": "#D4E157",
    "500": "#CDDC39",
    "600": "#C0CA33",
    "700": "#AFB42B",
    "800": "#9E9D24",
    "900": "#827717",
    "A100": "#F4FF81",
    "A200": "#EEFF41",
    "A400": "#C6FF00",
    "A700": "#AEEA00"
  },
  "Yellow": {
    "50": "#FFFDE7",
    "100": "#FFF9C4",
    "200": "#FFF59D",
    "300": "#FFF176",
    "400": "#FFEE58",
    "500": "#FFEB3B",
    "600": "#FDD835",
    "700": "#FBC02D",
    "800": "#F9A825",
    "900": "#F57F17",
    "A100": "#FFFF8D",
    "A200": "#FFFF00",
    "A400": "#FFEA00",
    "A700": "#FFD600"
  },
  "Amber": {
    "50": "#FFF8E1",
    "100": "#FFECB3",
    "200": "#FFE082",
    "300": "#FFD54F",
    "400": "#FFCA28",
    "500": "#FFC107",
    "600": "#FFB300",
    "700": "#FFA000",
    "800": "#FF8F00",
    "900": "#FF6F00",
    "A100": "#FFE57F",
    "A200": "#FFD740",
    "A400": "#FFC400",
    "A700": "#FFAB00"
  },
  "Orange": {
    "50": "#FFF3E0",
    "100": "#FFE0B2",
    "200": "#FFCC80",
    "300": "#FFB74D",
    "400": "#FFA726",
    "500": "#FF9800",
    "600": "#FB8C00",
    "700": "#F57C00",
    "800": "#EF6C00",
    "900": "#E65100",
    "A100": "#FFD180",
    "A200": "#FFAB40",
    "A400": "#FF9100",
    "A700": "#FF6D00"
  },
  "Deep Orange": {
    "50": "#FBE9E7",
    "100": "#FFCCBC",
    "200": "#FFAB91",
    "300": "#FF8A65",
    "400": "#FF7043",
    "500": "#FF5722",
    "600": "#F4511E",
    "700": "#E64A19",
    "800": "#D84315",
    "900": "#BF360C",
    "A100": "#FF9E80",
    "A200": "#FF6E40",
    "A400": "#FF3D00",
    "A700": "#DD2C00"
  },
  "Brown": {
    "50": "#EFEBE9",
    "100": "#D7CCC8",
    "200": "#BCAAA4",
    "300": "#A1887F",
    "400": "#8D6E63",
    "500": "#795548",
    "600": "#6D4C41",
    "700": "#5D4037",
    "800": "#4E342E",
    "900": "#3E2723"
  },
  "Grey": {
    "50": "#FAFAFA",
    "100": "#F5F5F5",
    "200": "#EEEEEE",
    "300": "#E0E0E0",
    "400": "#BDBDBD",
    "500": "#9E9E9E",
    "600": "#757575",
    "700": "#616161",
    "800": "#424242",
    "900": "#212121"
  },
  "Blue Grey": {
    "50": "#ECEFF1",
    "100": "#CFD8DC",
    "200": "#B0BEC5",
    "300": "#90A4AE",
    "400": "#78909C",
    "500": "#607D8B",
    "600": "#546E7A",
    "700": "#455A64",
    "800": "#37474F",
    "900": "#263238"
  },
  "Black": "#000000",
  "White": "#FFFFFF"
};

function getPercent(shade) {
  switch (shade.toString()) {
    case "50":
      return 0.9;
    case "100":
      return 0.7;
    case "200":
      return 0.5;
    case "300":
      return 0.333;
    case "400":
      return 0.166;
    case "500":
      return 0;
    case "600":
      return -0.125;
    case "700":
      return -0.25;
    case "800":
      return -0.375;
    case "900":
      return -0.5;
    case "A100":
      return 0.7;
    case "A200":
      return 0.5;
    case "A400":
      return 0.166;
    case "A700":
      return -0.25;
    default:
      throw new Error("Unknown shade value: " + shade);
  }
}

function shadeColor(color, shade) {
  var percent = getPercent(shade);
  var f = parseInt(color.slice(1), 16),
      t = percent < 0 ? 0 : 255,
      p = percent < 0 ? percent * -1 : percent,
      R = f >> 16,
      G = f >> 8 & 0x00FF,
      B = f & 0x0000FF;
  return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

function getColor(name, shade) {
  if (name === "White") return "#FFFFFF";
  if (name === "Black") return "#000000";

  shade = shade || 500;
  var color;

  var hue = colors[name];

  if (hue) {
    color = hue[shade];
  } else if (name.startsWith("#")) {
    color = shadeColor(name, shade);
  }

  if (!color) {
    throw new Error("Unable to get requested color: " + name);
  }

  return color;
}

// static func getColor(inContrastTo: UIColor) -> UIColor {
//         let redCoefficient = CGFloat(0.2126)
//         let greenCoefficient = CGFloat(0.7152)
//         let blueCoefficient = CGFloat(0.0722)
//         let lowGammaAdjustCoefficient = CGFloat(1 / 12.92)
//
//         func adjustGamma(_ component: CGFloat) -> CGFloat {
//             return pow((component + 0.055) / 1.055, 2.4);
//         }
//
//         func getLuminance(_ color: UIColor) -> CGFloat {
//             var red : CGFloat = 0
//             var green : CGFloat = 0
//             var blue : CGFloat = 0
//             var alpha: CGFloat = 0
//
//             color.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
//             let r = red <= 0.03928 ? red * lowGammaAdjustCoefficient : adjustGamma(red)
//             let g = green <= 0.03928 ? green * lowGammaAdjustCoefficient : adjustGamma(green)
//             let b = blue < 0.03928 ? blue * lowGammaAdjustCoefficient : adjustGamma(blue)
//
//             return r * redCoefficient + g * greenCoefficient + b * blueCoefficient
//         }
//
//         func getContrast(_ colorOne: UIColor, _ colorTwo: UIColor) -> CGFloat {
//             let luminanceOne = getLuminance(colorOne)
//             let luminanceTwo = getLuminance(colorTwo)
//
//             let l1 = max(luminanceOne, luminanceTwo)
//             let l2 = min(luminanceOne, luminanceTwo)
//             return (l1 + 0.05) / (l2 + 0.05);
//         }
//
//         let blackContrast = getContrast(inContrastTo, UIColor.black)
//         let whiteContrast = getContrast(inContrastTo, UIColor.white)
//
//         if blackContrast > whiteContrast {
//             return UIColor.black
//         } else {
//             return UIColor.white
//         }
//     }
// export function getColorInContrastTo(color) {
//   const redCoefficient = 0.2126
//   const greenCoefficient = 0.7152
//   const blueCoefficient = 0.0722
//   const lowGammaAdjustCoefficient = 1 / 12.92
// }
},{}],69:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = color;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _colorPalette = require('./color-palette');

var colorPalette = _interopRequireWildcard(_colorPalette);

var _util = require('./util');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function color() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (options.color) {
    options.opacity = options.opacity || 1;
  }

  options.theme = options.theme || 'light';
  options.color = options.color || (options.theme === 'light' ? '#000000' : '#FFFFFF');
  options.opacity = options.opacity || (options.theme === 'light' ? 1 : 0.87);

  return [(0, _jsuaStyle.filter)(function () {
    return !!options.color;
  }, function (el) {
    var color = colorPalette.getColor(options.color, options.shade);
    el.style.color = (0, _util.rgba)(color, options.opacity);
  })];
}
},{"./color-palette":68,"./util":92,"@lynx-json/jsua-style":98}],70:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = container;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function container() {
  return [(0, _view2.default)(), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.display = 'grid';
  }, function (el) {
    return el.style.gridGap = '16px';
  }, function (el) {
    return el.style.gridTemplateColumns = '1fr';
  }, function (el) {
    return el.style.alignContent = 'start';
  }])];
}
},{"./view":93,"@lynx-json/jsua-style":98}],71:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = elevation;
var shadows = ["none", "0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12)", "0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12)", "0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12)", "0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)", "0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 5px 8px 0px rgba(0, 0, 0, 0.14), 0px 1px 14px 0px rgba(0, 0, 0, 0.12)", "0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 6px 10px 0px rgba(0, 0, 0, 0.14), 0px 1px 18px 0px rgba(0, 0, 0, 0.12)", "0px 4px 5px -2px rgba(0, 0, 0, 0.2), 0px 7px 10px 1px rgba(0, 0, 0, 0.14), 0px 2px 16px 1px rgba(0, 0, 0, 0.12)", "0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12)", "0px 5px 6px -3px rgba(0, 0, 0, 0.2), 0px 9px 12px 1px rgba(0, 0, 0, 0.14), 0px 3px 16px 2px rgba(0, 0, 0, 0.12)", "0px 6px 6px -3px rgba(0, 0, 0, 0.2), 0px 10px 14px 1px rgba(0, 0, 0, 0.14), 0px 4px 18px 3px rgba(0, 0, 0, 0.12)", "0px 6px 7px -4px rgba(0, 0, 0, 0.2), 0px 11px 15px 1px rgba(0, 0, 0, 0.14), 0px 4px 20px 3px rgba(0, 0, 0, 0.12)", "0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 12px 17px 2px rgba(0, 0, 0, 0.14), 0px 5px 22px 4px rgba(0, 0, 0, 0.12)", "0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 13px 19px 2px rgba(0, 0, 0, 0.14), 0px 5px 24px 4px rgba(0, 0, 0, 0.12)", "0px 7px 9px -4px rgba(0, 0, 0, 0.2), 0px 14px 21px 2px rgba(0, 0, 0, 0.14), 0px 5px 26px 4px rgba(0, 0, 0, 0.12)", "0px 8px 9px -5px rgba(0, 0, 0, 0.2), 0px 15px 22px 2px rgba(0, 0, 0, 0.14), 0px 6px 28px 5px rgba(0, 0, 0, 0.12)", "0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)", "0px 8px 11px -5px rgba(0, 0, 0, 0.2), 0px 17px 26px 2px rgba(0, 0, 0, 0.14), 0px 6px 32px 5px rgba(0, 0, 0, 0.12)", "0px 9px 11px -5px rgba(0, 0, 0, 0.2), 0px 18px 28px 2px rgba(0, 0, 0, 0.14), 0px 7px 34px 6px rgba(0, 0, 0, 0.12)", "0px 9px 12px -6px rgba(0, 0, 0, 0.2), 0px 19px 29px 2px rgba(0, 0, 0, 0.14), 0px 7px 36px 6px rgba(0, 0, 0, 0.12)", "0px 10px 13px -6px rgba(0, 0, 0, 0.2), 0px 20px 31px 3px rgba(0, 0, 0, 0.14), 0px 8px 38px 7px rgba(0, 0, 0, 0.12)", "0px 10px 13px -6px rgba(0, 0, 0, 0.2), 0px 21px 33px 3px rgba(0, 0, 0, 0.14), 0px 8px 40px 7px rgba(0, 0, 0, 0.12)", "0px 10px 14px -6px rgba(0, 0, 0, 0.2), 0px 22px 35px 3px rgba(0, 0, 0, 0.14), 0px 8px 42px 7px rgba(0, 0, 0, 0.12)", "0px 11px 14px -7px rgba(0, 0, 0, 0.2), 0px 23px 36px 3px rgba(0, 0, 0, 0.14), 0px 9px 44px 8px rgba(0, 0, 0, 0.12)", "0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12)"];

function elevation(level) {
  level = level || 0;
  return [function (el) {
    return el.style.boxShadow = shadows[level];
  }, function (el) {
    return el.style.zIndex = level;
  }];
}

elevation.none = function (el) {
  return elevation(0);
};
elevation.card = function (el) {
  return elevation(2);
};
elevation.cardHover = function (el) {
  return elevation(8);
};
elevation.menu = function (el) {
  return elevation(8);
};
elevation.appBar = function (el) {
  return elevation(4);
};
},{}],72:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = expansionPanel;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _color = require('./color');

var _color2 = _interopRequireDefault(_color);

var _elevation = require('./elevation');

var _elevation2 = _interopRequireDefault(_elevation);

var _border = require('./border');

var _border2 = _interopRequireDefault(_border);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function expansionPanel() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.theme = options.theme || "light";

  var innerHTML = '\n    <div role="presentation" data-jsua-style-slot="header-wrapper">\n      <div data-jsua-style-slot="header" role="presentation"></div>\n      <div data-jsua-style-slot="toggle" role="presentation"><i role="presentation" class="material-icons">keyboard_arrow_down</i></div>\n    </div>\n    <div role="presentation" data-jsua-style-slot="content-wrapper">\n      <div data-jsua-style-slot="content" role="presentation"></div>\n    </div>\n  ';

  return [(0, _jsuaStyle.component)('material-expansion-panel', innerHTML), (0, _jsuaStyle.filter)(_jsuaStyle.filters.has(options.headerMapper), (0, _jsuaStyle.slot)('header', options.headerMapper)), (0, _elevation2.default)(2), function (el) {
    return el.style.display = 'flex';
  }, function (el) {
    return el.style.flexDirection = 'column';
  }, function (el) {
    return el.style.alignItems = 'stretch';
  }, (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('header-wrapper'), [function (el) {
    return el.style.cursor = 'default';
  }, function (el) {
    return el.style.display = 'flex';
  }, function (el) {
    return el.style.flexDirection = 'row';
  }, function (el) {
    return el.style.flexWrap = 'nowrap';
  }, function (el) {
    return el.style.alignItems = 'center';
  }, function (el) {
    return el.style.paddingLeft = '24px';
  }, function (el) {
    return el.style.paddingRight = '24px';
  }, function (el) {
    return el.style.minHeight = '48px';
  }, function (el) {
    return el.style.transition = 'min-height 175ms ease-in-out';
  }, (0, _jsuaStyle.on)('click', function (el, evt) {
    (0, _jsuaStyle.map)(_jsuaStyle.mappers.component(), (0, _jsuaStyle.toggleState)('open'))(el);
    evt.stopPropagation();
    evt.preventDefault();
  })]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('header'), function (el) {
    return el.style.flexGrow = 1;
  }), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('toggle'), [function (el) {
    return el.style.display = 'flex';
  }, function (el) {
    return el.style.alignItems = 'center';
  }, function (el) {
    return el.style.marginLeft = '16px';
  }, (0, _color2.default)({ color: options.color, opacity: 0.38, theme: options.theme }), (0, _jsuaStyle.select)('i.material-icons', [function (el) {
    return el.style.width = '24px';
  }, function (el) {
    return el.style.height = '24px';
  }, function (el) {
    return el.style.overflow = 'hidden';
  }, function (el) {
    return el.style.cursor = 'default';
  }, function (el) {
    return el.style.borderRadius = '2px';
  }, (0, _jsuaStyle.when)('normal', function (el) {
    return el.style.border = '1px solid transparent';
  }), (0, _jsuaStyle.when)('hover', (0, _border2.default)(options)), (0, _jsuaStyle.on)('mouseenter', (0, _jsuaStyle.setState)('hover')), (0, _jsuaStyle.on)('mouseleave', (0, _jsuaStyle.clearState)('hover')), (0, _jsuaStyle.setState)('normal')])]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content-wrapper'), [function (el) {
    return el.style.display = 'block';
  }, function (el) {
    return el.style.paddingLeft = '24px';
  }, function (el) {
    return el.style.paddingRight = '24px';
  }, function (el) {
    return el.style.transition = 'max-height 175ms ease-in-out, opacity 175ms ease-in-out';
  }, function (el) {
    return el.style.overflowY = 'hidden';
  }, function (el) {
    return el.style.overflowX = 'hidden';
  }]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), function (el) {
    return el.style.paddingBottom = '16px';
  }), (0, _jsuaStyle.when)('normal', [(0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('header-wrapper'), [function (el) {
    return el.style.minHeight = '48px';
  }]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('toggle'), [(0, _jsuaStyle.select)('i.material-icons', function (el) {
    return el.textContent = "keyboard_arrow_down";
  })]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content-wrapper'), [function (el) {
    return el.style.maxHeight = '0px';
  }, function (el) {
    return el.style.opacity = 0;
  }])]), (0, _jsuaStyle.when)('open', [(0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('header-wrapper'), [function (el) {
    return el.style.minHeight = '64px';
  }]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('toggle'), [(0, _jsuaStyle.select)('i.material-icons', function (el) {
    return el.textContent = "keyboard_arrow_up";
  })]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content-wrapper'), [function (el) {
    return el.style.opacity = 1;
  }, function (el) {
    return el.style.maxHeight = el.firstElementChild.offsetHeight + 'px';
  }])]), (0, _jsuaStyle.setState)('normal')];
}
},{"./border":66,"./color":69,"./elevation":71,"@lynx-json/jsua-style":98}],73:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jsuaStyle = require('@lynx-json/jsua-style');

var style = _interopRequireWildcard(_jsuaStyle);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.default = Object.assign({
  shouldHaveStandingLine: function shouldHaveStandingLine() {
    return function (el) {
      return el.hasAttribute("data-jsua-material-standing-line");
    };
  },
  shouldNegateContainerPadding: function shouldNegateContainerPadding() {
    return function (el) {
      return el.hasAttribute('data-jsua-material-negate-padding');
    };
  }
}, style.filters);
},{"@lynx-json/jsua-style":98}],74:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = flatButton;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _background = require('./background');

var _background2 = _interopRequireDefault(_background);

var _color = require('./color');

var _color2 = _interopRequireDefault(_color);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function flatButton() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.color = options.color || 'Grey';
  return [function (el) {
    return el.style.paddingTop = '6px';
  }, function (el) {
    return el.style.paddingBottom = '6px';
  }, function (el) {
    return el.style.outline = 'none';
  }, function (el) {
    return el.style.cursor = 'pointer';
  }, function (el) {
    return el.style.minHeight = '36px';
  }, function (el) {
    return el.style.minWidth = '36px';
  }, function (el) {
    return el.style.paddingLeft = '16px';
  }, function (el) {
    return el.style.paddingRight = '16px';
  }, function (el) {
    return el.style.borderRadius = '2px';
  }, (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.cursor = 'pointer';
  }, function (el) {
    return el.style.alignItems = 'center';
  }, function (el) {
    return el.style.justifyContent = 'center';
  }, function (el) {
    return el.style.justifyItems = 'center';
  }]), (0, _jsuaStyle.when)('normal', [function (el) {
    return el.style.display = 'inline-flex';
  }, function (el) {
    return el.style.backgroundColor = 'inherit';
  }, (0, _jsuaStyle.map)(options.labelMapper, [function (el) {
    return el.style.fontWeight = 'normal';
  }, function (el) {
    return el.style.color = 'inherit';
  }, function (el) {
    return el.style.textDecoration = 'none';
  }])]), (0, _jsuaStyle.when)('selectable', (0, _jsuaStyle.map)(options.labelMapper, [function (el) {
    return el.style.fontWeight = 'normal';
  }, (0, _color2.default)({ color: options.color, shade: '700' })])), (0, _jsuaStyle.when)('selected', (0, _jsuaStyle.map)(options.labelMapper, [function (el) {
    return el.style.color = 'inherit';
  }, function (el) {
    return el.style.fontWeight = 'bold';
  }])), (0, _jsuaStyle.when)('focus', [(0, _background2.default)({ backgroundColor: options.color, opacity: 0.12 })]), (0, _jsuaStyle.when)('pressed', [(0, _background2.default)({ backgroundColor: options.color, opacity: 0.4 })]), (0, _jsuaStyle.on)('focusin', (0, _jsuaStyle.setState)('focus')), (0, _jsuaStyle.on)('focusout', (0, _jsuaStyle.clearState)('focus')), (0, _jsuaStyle.on)('mousedown', (0, _jsuaStyle.setState)('pressed')), (0, _jsuaStyle.on)('mouseup', (0, _jsuaStyle.clearState)('pressed')), (0, _jsuaStyle.on)('touchstart', (0, _jsuaStyle.setState)('pressed')), (0, _jsuaStyle.on)('touchend', (0, _jsuaStyle.clearState)('pressed'))];
}
},{"./background":65,"./color":69,"@lynx-json/jsua-style":98}],75:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = footer;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _standingLine = require('./standing-line');

var _standingLine2 = _interopRequireDefault(_standingLine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function footer() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return [(0, _view2.default)(), (0, _standingLine2.default)(), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.display = 'grid';
  }, function (el) {
    return el.style.gridGap = '16px';
  }, function (el) {
    return el.style.justifyContent = 'start';
  }, function (el) {
    return el.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 1fr))';
  }, (0, _jsuaStyle.filter)(function (el) {
    return el.children.length === 1;
  }, function (el) {
    return el.style.gridTemplateColumns = '1fr';
  }), (0, _jsuaStyle.filter)(function (el) {
    return el.children.length === 2;
  }, function (el) {
    return el.style.gridTemplateColumns = 'auto 1fr';
  }), (0, _jsuaStyle.filter)(function (el) {
    return el.children.length === 3;
  }, [function (el) {
    return el.style.gridTemplateColumns = '1fr 2fr 1fr';
  }, (0, _jsuaStyle.map)(_jsuaStyle.mappers.nth(2, _jsuaStyle.mappers.children()), function (el) {
    return el.style.justifySelf = 'center';
  }), (0, _jsuaStyle.map)(_jsuaStyle.mappers.last(_jsuaStyle.mappers.children()), function (el) {
    return el.style.justifySelf = 'end';
  })])])];
}
},{"./standing-line":86,"./view":93,"@lynx-json/jsua-style":98}],76:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = grid;

var _jsuaStyle = require("@lynx-json/jsua-style");

var gutterPattern = function gutterPattern() {
  return (/^(\d*)([a-z]*)$/
  );
};

function parseValue(gutter) {
  var parsedGutter = gutterPattern().exec(gutter);
  var gutterValue = +parsedGutter[1];
  var gutterUnits = parsedGutter[2];

  return {
    value: gutterValue,
    units: gutterUnits
  };
}

function header() {
  return [function (el) {
    return el.style.margin = "0px";
  }, function (el) {
    return el.style.maxWidth = "100%";
  }, function (el) {
    return el.style.width = "auto";
  }];
}

function footer() {
  return [function (el) {
    return el.style.margin = "0px";
  }, function (el) {
    return el.style.maxWidth = "100%";
  }, function (el) {
    return el.style.width = "auto";
  }];
}

function column(options) {
  options = options || {};
  var span = options.span,
      offsetLeft = options.offsetLeft,
      offsetRight = options.offsetRight,
      test = options.test;

  function wrapInCell(element) {
    var cell = document.createElement("div");
    cell.style.display = "flex";
    cell.style.flexDirection = "column";
    cell.setAttribute("role", "presentation");
    cell.setAttribute("data-material-grid-cell", "true");
    element.style.flexShrink = 0;

    element.parentElement.replaceChild(cell, element);
    cell.appendChild(element);

    (0, _jsuaStyle.query)(element).each([(0, _jsuaStyle.when)("normal", function () {
      return cell.style.display = "flex";
    }), (0, _jsuaStyle.when)("visibility", "hidden", function () {
      return cell.style.display = "none";
    })]);

    return cell;
  }

  return function (element) {
    var cell;
    if (element.hasAttribute("data-material-grid-cell")) {
      cell = element;
    } else if (element.parentElement.hasAttribute("data-material-grid-cell")) {
      cell = element.parentElement;
    } else {
      cell = wrapInCell(element);
    }

    var gridWrapper = cell.parentElement;
    var columns = +gridWrapper.getAttribute("data-material-grid-columns");
    var gutter = gridWrapper.getAttribute("data-material-grid-gutter");

    var parsedGutter = parseValue(gutter);

    var totalColumnsOfThisSize = columns / span;
    cell.setAttribute("data-jsua-material-grid-column-span", span);
    var columnWidth = "calc(((100% - (" + gutter + " * " + totalColumnsOfThisSize + ")) / " + totalColumnsOfThisSize + ") - 0.1px)";
    cell.style.width = columnWidth;

    if (test) {
      cell.setAttribute("data-test-column-width", columnWidth);
    }

    var margin = parsedGutter.value / 2 + parsedGutter.units;
    cell.style.margin = margin;

    if (offsetLeft) {
      var percentage = columns / offsetLeft;
      var offsetMargin = "calc(((100% - " + gutter + " * " + percentage + ") / " + percentage + ") + " + 1.5 * parsedGutter.value + parsedGutter.units + " - 0.1px)";
      cell.style.marginLeft = offsetMargin;
    }

    if (offsetRight) {
      var _percentage = columns / offsetRight;
      var _offsetMargin = "calc(((100% - " + gutter + " * " + _percentage + ") / " + _percentage + ") + " + 1.5 * parsedGutter.value + parsedGutter.units + " - 0.1px)";
      cell.style.marginRight = _offsetMargin;
    }
  };
}

function grid() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var columns = options.columns,
      gutter = options.gutter,
      margin = options.margin || "0px",
      defaultColumnSpan = options.defaultColumnSpan,
      defaultOffsetLeft = options.defaultOffsetLeft,
      defaultOffsetRight = options.defaultOffsetRight,
      test = options.test,
      mapHeader = options.mapHeader,
      mapFooter = options.mapFooter;

  var parsedGutter = parseValue(gutter);
  var parsedMargin = parseValue(margin);

  var calculatedMargin = "calc(-" + parsedGutter.value / 2 + parsedGutter.units + " + " + parsedMargin.value + parsedMargin.units + ")";

  var innerHTML = "\n    <div role=\"presentation\" data-jsua-style-slot=\"header\"></div>\n    <div role=\"presentation\" data-jsua-style-slot=\"content\"></div>\n    <div role=\"presentation\" data-jsua-style-slot=\"footer\"></div>\n  ";

  return [
  // // The grid explicitly causes overflow. It needs to be hidden.
  // el => el.style.overflow = "hidden",
  (0, _jsuaStyle.filter)("[data-jsua-style-component~=material-grid]", function (el) {
    return el.setAttribute("data-jsua-material-grid-reset", true);
  }), (0, _jsuaStyle.filter)(":not([data-jsua-material-grid-reset])", (0, _jsuaStyle.component)("material-grid", innerHTML)), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot("content"), [function (el) {
    return el.style.margin = calculatedMargin;
  }, function (el) {
    return el.style.flexWrap = "wrap";
  }, function (el) {
    return el.setAttribute("data-material-grid-columns", columns);
  }, function (el) {
    return el.setAttribute("data-material-grid-gutter", gutter);
  }, function (el) {
    return el.setAttribute("data-material-grid-margin", margin);
  }, (0, _jsuaStyle.filter)(function () {
    return test;
  }, function (el) {
    return el.setAttribute("data-test-margin", calculatedMargin);
  })]), (0, _jsuaStyle.filter)("[data-jsua-material-grid-reset]", [(0, _jsuaStyle.map)(_jsuaStyle.mappers.slot("content"), [(0, _jsuaStyle.map)(_jsuaStyle.mappers.children(), [column({
    span: defaultColumnSpan,
    offsetLeft: defaultOffsetLeft,
    offsetRight: defaultOffsetRight
  })])])]), (0, _jsuaStyle.filter)(":not([data-jsua-material-grid-reset])", [(0, _jsuaStyle.slot)("header", mapHeader), (0, _jsuaStyle.slot)("footer", mapFooter), function (el) {
    return el.style.display = "flex";
  }, function (el) {
    return el.style.flexDirection = "column";
  }, function (el) {
    return el.style.alignItems = "stretch";
  }, (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot("header"), [function (el) {
    return el.style.display = "flex";
  }, function (el) {
    return el.style.flexDirection = "column";
  }, function (el) {
    return el.style.alignItems = "stretch";
  }, function (el) {
    return el.style.flexGrow = 0;
  }]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot("content"), [function (el) {
    return el.style.display = "flex";
  }, function (el) {
    return el.style.flexDirection = "row";
  }, function (el) {
    return el.style.alignItems = "stretch";
  }, function (el) {
    return el.style.flexGrow = 1;
  }, function (el) {
    return el.style.maxHeight = "100%";
  }, // This removes unncessary scroll bars.
  function (el) {
    return el.style.maxWidth = "none";
  }, // This cannot be 100% because of margin offsets.
  (0, _jsuaStyle.map)(_jsuaStyle.mappers.children(), [column({
    span: defaultColumnSpan,
    offsetLeft: defaultOffsetLeft,
    offsetRight: defaultOffsetRight
  })])]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot("footer"), [function (el) {
    return el.style.display = "flex";
  }, function (el) {
    return el.style.flexDirection = "column";
  }, function (el) {
    return el.style.alignItems = "stretch";
  }, function (el) {
    return el.style.flexGrow = 0;
  }]), (0, _jsuaStyle.when)("normal", function (el) {
    return el.style.display = "flex";
  }), (0, _jsuaStyle.when)("visibility", "hidden", function (el) {
    return el.style.display = "none";
  }), (0, _jsuaStyle.setState)("normal")])];
}

grid.column = column;
},{"@lynx-json/jsua-style":98}],77:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = group;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _filters = require('./filters');

var _filters2 = _interopRequireDefault(_filters);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function group() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (options.alignItems === 'start') options.alignItems = 'flex-start';
  if (options.alignItems === 'end') options.alignItems = 'flex-end';

  options.gap = options.gap || '0.25em';
  return [(0, _view2.default)(), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.display = 'flex';
  }, function (el) {
    return el.style.flexDirection = 'row';
  }, function (el) {
    return el.style.flexWrap = 'wrap';
  }, (0, _jsuaStyle.filter)(function () {
    return options.alignItems;
  }, function (el) {
    return el.style.alignItems = options.alignItems;
  }), (0, _jsuaStyle.map)(_jsuaStyle.mappers.children(':not(:last-child)'), function (el) {
    return el.style.marginRight = options.gap;
  }), (0, _jsuaStyle.adjust)((0, _jsuaStyle.map)(_jsuaStyle.mappers.children(_filters2.default.shouldHaveStandingLine()), function (el) {
    return el.style.flexBasis = '100%';
  }))])];
}
},{"./filters":73,"./view":93,"@lynx-json/jsua-style":98}],78:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = header;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _standingLine = require('./standing-line');

var _standingLine2 = _interopRequireDefault(_standingLine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function header() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return [(0, _view2.default)(), (0, _standingLine2.default)(), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.display = 'grid';
  }, function (el) {
    return el.style.gridGap = '16px';
  }, function (el) {
    return el.style.alignContent = 'center';
  }, function (el) {
    return el.style.alignItems = 'center';
  }, function (el) {
    return el.style.gridTemplateColumns = 'repeat(auto-fit, minmax(160px, 1fr))';
  }, (0, _jsuaStyle.filter)(function (el) {
    return el.children.length === 1;
  }, function (el) {
    return el.style.gridTemplateColumns = '1fr';
  }), (0, _jsuaStyle.filter)(function (el) {
    return el.children.length === 2;
  }, function (el) {
    return el.style.gridTemplateColumns = 'auto 1fr';
  }), (0, _jsuaStyle.filter)(function (el) {
    return el.children.length === 3;
  }, [function (el) {
    return el.style.gridTemplateColumns = '1fr 2fr 1fr';
  }, (0, _jsuaStyle.map)(_jsuaStyle.mappers.nth(2, _jsuaStyle.mappers.children()), function (el) {
    return el.style.justifySelf = 'center';
  }), (0, _jsuaStyle.map)(_jsuaStyle.mappers.last(_jsuaStyle.mappers.children()), function (el) {
    return el.style.justifySelf = 'end';
  })])])];
}
},{"./standing-line":86,"./view":93,"@lynx-json/jsua-style":98}],79:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flatButton = exports.textInput = exports.tableRow = exports.table = exports.list = exports.footer = exports.set = exports.negateContainerPadding = exports.padding = exports.group = exports.color = exports.border = exports.colorPalette = exports.header = exports.textField = exports.text = exports.raisedButton = exports.menu = exports.grid = exports.expansionPanel = exports.elevation = exports.container = exports.card = exports.background = undefined;

var _background = require('./background');

var _background2 = _interopRequireDefault(_background);

var _card = require('./card');

var _card2 = _interopRequireDefault(_card);

var _elevation = require('./elevation');

var _elevation2 = _interopRequireDefault(_elevation);

var _expansionPanel = require('./expansion-panel');

var _expansionPanel2 = _interopRequireDefault(_expansionPanel);

var _grid = require('./grid');

var _grid2 = _interopRequireDefault(_grid);

var _menu = require('./menu');

var _menu2 = _interopRequireDefault(_menu);

var _raisedButton = require('./raised-button');

var _raisedButton2 = _interopRequireDefault(_raisedButton);

var _text = require('./text');

var _text2 = _interopRequireDefault(_text);

var _textField = require('./text-field');

var _textField2 = _interopRequireDefault(_textField);

var _header = require('./header');

var _header2 = _interopRequireDefault(_header);

var _colorPalette = require('./color-palette');

var colorPalette = _interopRequireWildcard(_colorPalette);

var _border = require('./border');

var _border2 = _interopRequireDefault(_border);

var _color = require('./color');

var _color2 = _interopRequireDefault(_color);

var _container = require('./container');

var _container2 = _interopRequireDefault(_container);

var _group = require('./group');

var _group2 = _interopRequireDefault(_group);

var _padding = require('./padding');

var _padding2 = _interopRequireDefault(_padding);

var _negateContainerPadding = require('./negate-container-padding');

var _negateContainerPadding2 = _interopRequireDefault(_negateContainerPadding);

var _set = require('./set');

var _set2 = _interopRequireDefault(_set);

var _footer = require('./footer');

var _footer2 = _interopRequireDefault(_footer);

var _list = require('./list');

var _list2 = _interopRequireDefault(_list);

var _table = require('./table');

var _table2 = _interopRequireDefault(_table);

var _tableRow = require('./table-row');

var _tableRow2 = _interopRequireDefault(_tableRow);

var _textInput = require('./text-input');

var _textInput2 = _interopRequireDefault(_textInput);

var _flatButton = require('./flat-button');

var _flatButton2 = _interopRequireDefault(_flatButton);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.background = _background2.default;
exports.card = _card2.default;
exports.container = _container2.default;
exports.elevation = _elevation2.default;
exports.expansionPanel = _expansionPanel2.default;
exports.grid = _grid2.default;
exports.menu = _menu2.default;
exports.raisedButton = _raisedButton2.default;
exports.text = _text2.default;
exports.textField = _textField2.default;
exports.header = _header2.default;
exports.colorPalette = colorPalette;
exports.border = _border2.default;
exports.color = _color2.default;
exports.group = _group2.default;
exports.padding = _padding2.default;
exports.negateContainerPadding = _negateContainerPadding2.default;
exports.set = _set2.default;
exports.footer = _footer2.default;
exports.list = _list2.default;
exports.table = _table2.default;
exports.tableRow = _tableRow2.default;
exports.textInput = _textInput2.default;
exports.flatButton = _flatButton2.default;
},{"./background":65,"./border":66,"./card":67,"./color":69,"./color-palette":68,"./container":70,"./elevation":71,"./expansion-panel":72,"./flat-button":74,"./footer":75,"./grid":76,"./group":77,"./header":78,"./list":80,"./menu":81,"./negate-container-padding":82,"./padding":83,"./raised-button":84,"./set":85,"./table":88,"./table-row":87,"./text":91,"./text-field":89,"./text-input":90}],80:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = list;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function list() {
  return [(0, _view2.default)(), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.display = 'grid';
  }, function (el) {
    return el.style.gridGap = '0px';
  }, function (el) {
    return el.style.gridTemplateColumns = '1fr';
  }, function (el) {
    return el.style.alignContent = 'start';
  }])];
}
},{"./view":93,"@lynx-json/jsua-style":98}],81:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = menu;

var _jsuaStyle = require("@lynx-json/jsua-style");

var _elevation = require("./elevation");

var _elevation2 = _interopRequireDefault(_elevation);

var _background = require("./background");

var _background2 = _interopRequireDefault(_background);

var _text = require("./text");

var _text2 = _interopRequireDefault(_text);

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var keys = {
  escape: 27,
  spaceBar: 32
};

function menu(options) {
  var textColor = (0, _util.getTextColor)(options);
  var opacity = (0, _util.getPrimaryTextOpacity)(textColor);

  return function (element) {
    var innerHTML = "\n      <div role=\"presentation\">\n        <div data-jsua-style-slot=\"header\" role=\"presentation\"></div>\n        <div data-jsua-style-slot=\"toggle\" role=\"presentation\"><i class=\"material-icons\">arrow_drop_down</i></div>\n      </div>\n      <div role=\"presentation\">\n        <div data-jsua-style-slot=\"content\" role=\"presentation\"></div>\n      </div>\n    ";

    (0, _jsuaStyle.query)(element).each([(0, _jsuaStyle.component)("material-menu", innerHTML), function (el) {
      return el.style.position = "relative";
    }, (0, _jsuaStyle.on)("focusout", function () {
      return element.materialClose();
    }), (0, _jsuaStyle.on)("keyup", function (el, evt) {
      if (evt.keyCode === keys.escape) {
        element.materialClose();
      }

      if (evt.keyCode === keys.spaceBar) {
        element.materialOpen();
      }
    })]);

    var menuHeader = element.firstElementChild;
    var menu = element.lastElementChild;
    var contentContainer = menu.firstElementChild;

    var state = options && options.state || "closed";

    var closedStyle = [function (el) {
      return el.style.maxHeight = "0px";
    }, function (el) {
      return el.style.opacity = 0;
    }, function (el) {
      return el.style.paddingTop = 0;
    }, function (el) {
      return el.style.paddingBottom = 0;
    }, _elevation2.default.none()];
    var openStyle = [function (el) {
      return el.style.maxHeight = contentContainer.offsetHeight + 16 + "px";
    }, function (el) {
      return el.style.opacity = 1;
    }, function (el) {
      return el.style.paddingTop = "8px";
    }, function (el) {
      return el.style.paddingBottom = "8px";
    }, _elevation2.default.menu()];

    element.materialOpen = function () {
      (0, _jsuaStyle.query)(menu).each([function () {
        return state = "open";
      }, openStyle]
      // el => el.focus() // This was causing problems with rux dropdown... investigate.
      );
    };

    element.materialClose = function () {
      (0, _jsuaStyle.query)(menu).each([function () {
        return state = "closed";
      }, closedStyle]);
    };

    function toggleState() {
      if (state === "open") {
        element.materialClose();
      } else {
        element.materialOpen();
      }
    }

    (0, _jsuaStyle.query)(menuHeader).each([function (el) {
      return el.style.color = textColor;
    }, function (el) {
      return el.style.opacity = opacity;
    }, function (el) {
      return el.style.cursor = "default";
    }, function (el) {
      return el.style.paddingLeft = "24px";
    }, function (el) {
      return el.style.paddingRight = "24px";
    }, function (el) {
      return el.style.minHeight = "48px";
    }, function (el) {
      return el.style.display = "flex";
    }, function (el) {
      return el.style.flexDirection = "row";
    }, function (el) {
      return el.style.flexWrap = "nowrap";
    }, function (el) {
      return el.firstElementChild.style.flexGrow = 1;
    }, function (el) {
      return el.style.alignItems = "center";
    }, (0, _jsuaStyle.on)("click", toggleState)]);

    var toggleSlot = element.firstElementChild.lastElementChild;
    (0, _jsuaStyle.query)(toggleSlot).select("i.material-icons").each([function (el) {
      return el.style.color = textColor;
    }, function (el) {
      return el.style.opacity = opacity;
    }, function (el) {
      return el.style.width = "24px";
    }, function (el) {
      return el.style.height = "24px";
    }, function (el) {
      return el.style.overflow = "hidden";
    }, function (el) {
      return el.style.cursor = "default";
    }, function (el) {
      return el.style.borderRadius = "2px";
    }, function (el) {
      return el.style.border = "1px solid transparent";
    }, (0, _jsuaStyle.on)("mouseover", function (el) {
      return el.style.border = (0, _util.getDividerStyle)();
    }), (0, _jsuaStyle.on)("mouseout", function (el) {
      return el.style.border = "1px solid transparent";
    })]);

    (0, _jsuaStyle.query)(menu).each([function (el) {
      return el.style.color = textColor;
    }, function (el) {
      return el.style.opacity = opacity;
    }, function (el) {
      return el.style.display = "flex";
    }, function (el) {
      return el.style.flexDirection = "column";
    }, function (el) {
      return el.style.minWidth = "168px";
    }, function (el) {
      return el.tabIndex = -1;
    }, function (el) {
      return el.style.borderRadius = "2px";
    }, function (el) {
      return el.style.outline = "none";
    }, function (el) {
      return el.style.position = "absolute";
    }, function (el) {
      return el.style.top = 0;
    }, function (el) {
      return el.style.right = 0;
    }, function (el) {
      return el.style.transition = "all 175ms ease-in-out";
    }, _background2.default.menu(), function (el) {
      return el.style.overflow = "hidden";
    }]);

    element.materialRefresh = function () {
      if (state === "open") {
        element.materialOpen();
      } else {
        element.materialClose();
      }
    };

    element.materialRefresh();
  };
}

function findMenuComponent(element) {
  var menuComponent = (0, _util.findNearestAncestor)(element, "[data-jsua-style-component=material-menu]");

  if (!menuComponent) {
    throw new Error("The element must be contained within a material menu component.");
  }

  return menuComponent;
}

menu.item = function () {
  return function (element) {
    var menuComponent = findMenuComponent(element);

    (0, _jsuaStyle.query)(element).each([(0, _jsuaStyle.on)("mouseover", _background2.default.hover()), (0, _jsuaStyle.on)("mouseout", function (el) {
      return el.style.backgroundColor = "transparent";
    }), function (el) {
      return el.style.display = "flex";
    }, function (el) {
      return el.style.flexDirection = "row";
    }, function (el) {
      return el.style.minHeight = "48px";
    }, function (el) {
      return el.style.paddingLeft = "16px";
    }, function (el) {
      return el.style.paddingBottom = "20px";
    }, function (el) {
      return el.style.paddingTop = "12px";
    }, function (el) {
      return el.style.cursor = "default";
    }, (0, _jsuaStyle.on)("click", function () {
      return menuComponent.materialClose();
    })]);

    menuComponent.materialRefresh();
  };
};

menu.header = function () {
  return [_jsuaStyle.component.slot("material-menu", "header")];
};
},{"./background":65,"./elevation":71,"./text":91,"./util":92,"@lynx-json/jsua-style":98}],82:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = negateContainerPadding;
function negateContainerPadding() {
  return function (el) {
    return el.setAttribute("data-jsua-material-negate-padding", true);
  };
}
},{}],83:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = padding;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _filters = require('./filters');

var _filters2 = _interopRequireDefault(_filters);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function padding(value) {
  return [function (el) {
    return el.style.padding = value;
  }, (0, _jsuaStyle.adjust)([(0, _jsuaStyle.map)(_jsuaStyle.mappers.realChildren(_filters2.default.shouldNegateContainerPadding(), '[data-lynx-hints~=content]'), [function (el) {
    return el.style.marginLeft = '-' + value;
  }, function (el) {
    return el.style.marginRight = '-' + value;
  }]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.first(_jsuaStyle.mappers.realChildren("*", '[data-lynx-hints~=content]')), [(0, _jsuaStyle.filter)(_filters2.default.shouldNegateContainerPadding(), function (el) {
    return el.style.marginTop = '-' + value;
  })]), (0, _jsuaStyle.map)(_jsuaStyle.mappers.last(_jsuaStyle.mappers.realChildren("*", '[data-lynx-hints~=content]')), [(0, _jsuaStyle.filter)(_filters2.default.shouldNegateContainerPadding(), function (el) {
    return el.style.marginBottom = '-' + value;
  })])])];
}

padding.left = function (value) {
  return [function (el) {
    return el.style.paddingLeft = value;
  }, (0, _jsuaStyle.adjust)([(0, _jsuaStyle.map)(_jsuaStyle.mappers.realChildren(_filters2.default.shouldNegateContainerPadding(), '[data-lynx-hints~=content]'), [function (el) {
    return el.style.marginLeft = '-' + value;
  }])])];
};

padding.right = function (value) {
  return [function (el) {
    return el.style.paddingRight = value;
  }, (0, _jsuaStyle.adjust)([(0, _jsuaStyle.map)(_jsuaStyle.mappers.realChildren(_filters2.default.shouldNegateContainerPadding(), '[data-lynx-hints~=content]'), [function (el) {
    return el.style.marginRight = '-' + value;
  }])])];
};

padding.top = function (value) {
  return [function (el) {
    return el.style.padding = value;
  }, (0, _jsuaStyle.adjust)([(0, _jsuaStyle.map)(_jsuaStyle.mappers.first(_jsuaStyle.mappers.realChildren("*", '[data-lynx-hints~=content]')), [(0, _jsuaStyle.filter)(_filters2.default.shouldNegateContainerPadding(), function (el) {
    return el.style.marginTop = '-' + value;
  })])])];
};

padding.bottom = function (value) {
  return [function (el) {
    return el.style.padding = value;
  }, (0, _jsuaStyle.adjust)([(0, _jsuaStyle.map)(_jsuaStyle.mappers.last(_jsuaStyle.mappers.realChildren("*", '[data-lynx-hints~=content]')), [(0, _jsuaStyle.filter)(_filters2.default.shouldNegateContainerPadding(), function (el) {
    return el.style.marginBottom = '-' + value;
  })])])];
};
},{"./filters":73,"@lynx-json/jsua-style":98}],84:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = raisedButton;

var _jsuaStyle = require("@lynx-json/jsua-style");

var _util = require("./util");

var _elevation = require("./elevation");

var _elevation2 = _interopRequireDefault(_elevation);

var _text = require("./text");

var _text2 = _interopRequireDefault(_text);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function raisedButton(options) {
  var textColor = (0, _util.getTextColor)(options);

  return function (element) {
    (0, _jsuaStyle.query)(element).select("*").each(function (el) {
      return el.style.userSelect = "none";
    });

    (0, _jsuaStyle.query)(element).each([function (el) {
      return el.style.cursor = "default";
    }, function (el) {
      return el.style.display = "flex";
    }, function (el) {
      return el.style.flexDirection = "row";
    }, function (el) {
      return el.style.flexWrap = "wrap";
    }, function (el) {
      return el.style.alignItems = "center";
    }, function (el) {
      return el.style.justifyContent = "center";
    }, function (el) {
      return el.style.minHeight = "36px";
    }, function (el) {
      return el.style.minWidth = "88px";
    }, function (el) {
      return el.style.paddingLeft = "16px";
    }, function (el) {
      return el.style.paddingRight = "16px";
    }, function (el) {
      return el.style.borderRadius = "2px";
    }, function (el) {
      return (0, _elevation2.default)(2);
    }, function (el) {
      var touchTarget = document.createElement("div");
      touchTarget.role = "presentation";
      el.parentElement.replaceChild(touchTarget, el);
      touchTarget.addEventListener("click", function () {
        el.click();
      });
      touchTarget.appendChild(el);
      (0, _jsuaStyle.query)(touchTarget).each([_text2.default.button(textColor), function (el) {
        return el.style.display = "flex";
      }, function (el) {
        return el.style.flexDirection = "column";
      }, function (el) {
        return el.style.alignItems = "stretch";
      }, function (el) {
        return el.style.paddingTop = "6px";
      }, function (el) {
        return el.style.paddingBottom = "6px";
      }, (0, _jsuaStyle.on)("mousedown", function (el) {
        return (0, _jsuaStyle.query)(el.firstElementChild).each((0, _elevation2.default)(8));
      }), (0, _jsuaStyle.on)("mouseup", function (el) {
        return (0, _jsuaStyle.query)(el.firstElementChild).each((0, _elevation2.default)(2));
      }), (0, _jsuaStyle.on)("touchstart", function (el) {
        return (0, _jsuaStyle.query)(el.firstElementChild).each((0, _elevation2.default)(8));
      }), (0, _jsuaStyle.on)("touchend", function (el) {
        return (0, _jsuaStyle.query)(el.firstElementChild).each((0, _elevation2.default)(2));
      })]);
    }]);
  };
}
},{"./elevation":71,"./text":91,"./util":92,"@lynx-json/jsua-style":98}],85:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = set;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _filters = require('./filters');

var _filters2 = _interopRequireDefault(_filters);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function set() {
  return [(0, _view2.default)(), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.display = 'grid';
  }, function (el) {
    return el.style.gridGap = '16px';
  }, function (el) {
    return el.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
  }, (0, _jsuaStyle.adjust)((0, _jsuaStyle.map)(_jsuaStyle.mappers.children(_filters2.default.shouldHaveStandingLine()), function (el) {
    return el.style.gridColumn = '1 / -1';
  }))])];
}

set.auto = function () {
  return [set(), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.gridTemplateColumns = Array.from(el.children).map(function (el) {
      return "auto";
    }).join(" ");
  }, function (el) {
    return el.style.justifyContent = 'start';
  }, function (el) {
    var maxNaturalWidth = Array.from(el.children).filter(function (el) {
      return !_filters2.default.shouldHaveStandingLine()(el);
    }).map(function (el) {
      return el.offsetWidth;
    }).reduce(function (acc, cur) {
      return Math.max(acc, cur);
    }, 0);
    var minimumWidth = Math.max(maxNaturalWidth, el.offsetWidth / 3);
    el.style.gridTemplateColumns = 'repeat(auto-fit, minmax(' + minimumWidth + 'px, 1fr))';
    el.style.justifyContent = 'stretch';
  }])];
};
},{"./filters":73,"./view":93,"@lynx-json/jsua-style":98}],86:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = standingLine;
function standingLine() {
  return function (el) {
    return el.setAttribute("data-jsua-material-standing-line", true);
  };
}
},{}],87:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = tableRow;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function tableRow() {
  return [(0, _view2.default)(), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.display = 'grid';
  }, function (el) {
    return el.style.gridGap = '16px';
  }, function (el) {
    return el.style.gridTemplateColumns = (0, _jsuaStyle.query)(el).map(_jsuaStyle.mappers.children()).toArray().map(function (el) {
      return "1fr";
    }).join(" ");
  }])];
}

tableRow.auto = function autoSizedTableRow() {
  return [(0, _view2.default)(), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.display = 'grid';
  }, function (el) {
    return el.style.gridGap = '16px';
  }, function (el) {
    return el.style.justifyContent = 'start';
  }, function (el) {
    return el.style.gridTemplateColumns = (0, _jsuaStyle.query)(el).map(_jsuaStyle.mappers.children()).toArray().map(function (el) {
      return "auto";
    }).join(" ");
  }])];
};
},{"./view":93,"@lynx-json/jsua-style":98}],88:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = table;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

var _filters = require('./filters');

var _filters2 = _interopRequireDefault(_filters);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function table() {
  return [(0, _view2.default)(), (0, _jsuaStyle.map)(_jsuaStyle.mappers.slot('content'), [function (el) {
    return el.style.gridGap = '16px';
  }, function (el) {
    return el.style.display = 'none';
  }]), (0, _jsuaStyle.adjust)(function (el) {
    var maxWidth = el.offsetWidth;
    (0, _jsuaStyle.query)(el).map(_jsuaStyle.mappers.slot('content')).each([function (el) {
      return el.style.maxWidth = maxWidth + 'px';
    }, function (el) {
      return el.style.display = 'grid';
    }, function (el) {
      return el.style.overflowX = 'auto';
    }]);
  })];
}

table.auto = function () {
  return [table(), (0, _jsuaStyle.adjust)(adjustAlignment())];
};

function getColumnFraction(initialProportion) {
  if (initialProportion > .8) return 9;
  if (initialProportion > .7) return 8;
  if (initialProportion > .6) return 7;
  if (initialProportion > .5) return 6;
  if (initialProportion > .4) return 5;
  if (initialProportion > .3) return 4;
  if (initialProportion > .2) return 3;
  if (initialProportion > .1) return 2;
  return 1;
}

function adjustAlignment() {
  return function (tableElement) {
    var maxCellProportions = [];
    var maxWidths = [];
    var minWidths = [];
    var rows = (0, _jsuaStyle.query)(tableElement).map(_jsuaStyle.mappers.realChildren('*', '[data-lynx-hints~=content]')).toArray();

    rows.forEach(function measureRow(row) {
      var cells = (0, _jsuaStyle.query)(row).map(_jsuaStyle.mappers.slot('content')).map(_jsuaStyle.mappers.children()).toArray();
      if (cells.length < 2) return;

      var totalWidth = cells.map(function (cell) {
        return cell.offsetWidth;
      }).reduce(function (acc, cur) {
        return acc + cur;
      }, 0);

      cells.forEach(function measureCell(cell, index) {
        maxCellProportions[index] = Math.max(maxCellProportions[index] || 0, cell.offsetWidth / totalWidth);

        if (index === 0) {
          maxWidths[index] = Math.max(maxWidths[index] || 0, cell.offsetWidth);
          minWidths[index] = Math.min(minWidths[index] || cell.offsetWidth, cell.offsetWidth);
        }
      });
    });

    var templateColumns = maxCellProportions.map(getColumnFraction).map(function (fr, index) {
      if (index === 0 && maxWidths[index] === minWidths[index]) {
        return 'auto';
      }
      return fr + 'fr';
    }).join(' ');

    rows.forEach(function (row) {
      return (0, _jsuaStyle.query)(row).map(_jsuaStyle.mappers.slot('content')).each([function (el) {
        return el.style.justifyContent = 'stretch';
      }, function (el) {
        return el.style.gridTemplateColumns = templateColumns;
      }]);
    });
  };
}
},{"./filters":73,"./view":93,"@lynx-json/jsua-style":98}],89:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = textField;

var _jsuaStyle = require("@lynx-json/jsua-style");

var _util = require("./util");

var _text = require("./text");

var _text2 = _interopRequireDefault(_text);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function floatingLabel(options) {
  var textColor = (0, _util.getTextColor)(options);
  var opacity = (0, _util.getPrimaryTextOpacity)(options);

  return function (inputElement) {
    if (options && options.floatingLabel === false) return;
    if (inputElement.placeholder === undefined) return;

    var restingStyle = [function (el) {
      return el.style.transform = "translateY(8px)";
    }, function (el) {
      return el.style.opacity = 0;
    }];

    var floatingStyle = [function (el) {
      return el.style.transform = "none";
    }, function (el) {
      return el.style.opacity = opacity;
    }];

    var labelStyle = inputElement.value === "" ? restingStyle : floatingStyle;

    (0, _jsuaStyle.query)(inputElement.parentElement).select("[data-material-component~=text-field-label]").each([function (el) {
      return inputElement.placeholder = el.textContent;
    }, labelStyle]);
  };
}

function textField(options) {
  var hasError = false;
  var hasFocus = false;

  function errorState() {
    return [function (el) {
      return el.materialSetError = function () {
        return (0, _util.raiseEvent)(el, "material-error-on");
      };
    }, function (el) {
      return el.materialClearError = function () {
        return (0, _util.raiseEvent)(el, "material-error-off");
      };
    }, updateStateVisualization()];
  }

  function updateStateVisualization() {
    function getLabelColor() {
      // TODO: Convert as with background, etc.
      // if (hasError) return colorScheme.error;
      // if (hasFocus) return colorScheme.primary;

      return (0, _util.getTextColor)(options);
    }

    function getBorderStyle() {
      if (hasFocus && hasError) return "2px solid " + colorScheme.error;
      if (hasError) return "1px solid " + colorScheme.error;
      if (hasFocus) return "2px solid " + colorScheme.primary;
      return (0, _util.getDividerStyle)(options);
    }

    return function (el) {
      (0, _jsuaStyle.query)(el).select("[data-material-component~=text-field-label]").each(function (el) {
        return el.style.color = getLabelColor();
      });

      (0, _jsuaStyle.query)(el).select("[data-material-component~=text-field-control]").each([function (el) {
        return el.style.borderBottom = getBorderStyle();
      }, function (el) {
        if (hasFocus) {
          el.style.paddingBottom = "6px";
        } else {
          el.style.paddingBottom = "7px";
        }
      }]);
    };
  }

  return [errorState(), (0, _jsuaStyle.on)("material-error-on", [function (el) {
    return hasError = true;
  }, updateStateVisualization()]), (0, _jsuaStyle.on)("material-error-off", [function (el) {
    return hasError = false;
  }, updateStateVisualization()]), function (el) {
    return el.style.display = "flex";
  }, function (el) {
    return el.style.flexDirection = "column";
  }, function (el) {
    return el.style.alignItems = "stretch";
  }, (0, _jsuaStyle.on)("focusin", [function (el) {
    return hasFocus = true;
  }, updateStateVisualization()]), (0, _jsuaStyle.on)("focusout", [function (el) {
    return hasFocus = false;
  }, updateStateVisualization()])];
}

textField.label = function (options) {
  return [function (el) {
    return _text2.default.caption(el, options);
  }, function (el) {
    return el.style.marginTop = "16px";
  }, function (el) {
    return el.style.transition = "transform 175ms ease-in-out, opacity 175ms ease-in-out";
  }];
};

textField.control = function (options) {
  return [floatingLabel(options), function (el) {
    return el.style.marginTop = "8px";
  }, function (el) {
    return el.style.marginBottom = "8px";
  }, (0, _jsuaStyle.on)("input", floatingLabel(options))];
};

textField.singleLine = function (options) {
  return [textField.control(options), function (el) {
    return el.style.backgroundColor = "inherit";
  }, function (el) {
    return _text2.default.input(el, options);
  }, function (el) {
    return el.style.outline = "none";
  }, function (el) {
    return el.style.border = "none";
  }, function (el) {
    return el.style.borderBottom = (0, _util.getDividerStyle)(options);
  }, function (el) {
    return el.style.borderRadius = "0px";
  }, function (el) {
    return el.style.paddingBottom = "7px";
  } // 8px - 1px border
  ];
};

textField.dropdown = function (options) {
  return [textField.control(options), function (el) {
    return el.style.backgroundColor = "inherit";
  }, function (el) {
    return _text2.default.input(el, options);
  }, function (el) {
    return el.style.outline = "none";
  }, function (el) {
    return el.style.border = "none";
  }, function (el) {
    return el.style.borderBottom = (0, _util.getDividerStyle)(options);
  }, function (el) {
    return el.style.borderRadius = "0px";
  }, function (el) {
    return el.style.paddingBottom = "7px";
  }, // 8px - 1px border,
  function (el) {
    return el.style.WebkitAppearance = "none";
  }, function (el) {
    return el.style.MozAppearance = "none";
  }, function (el) {
    return el.style.appearance = "none";
  }, function (el) {
    return el.style.backgroundImage = "url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoIGQ9Ik03IDEwbDUgNSA1LTV6Ii8+CiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+Cjwvc3ZnPg==)";
  }, function (el) {
    return el.style.backgroundPosition = "right";
  }, function (el) {
    return el.style.backgroundRepeat = "no-repeat";
  }, function (el) {
    return el.style.backgroundSize = "24px 24px";
  }];
};
},{"./text":91,"./util":92,"@lynx-json/jsua-style":98}],90:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = textInput;

var _jsuaStyle = require('@lynx-json/jsua-style');

var _border = require('./border');

var _border2 = _interopRequireDefault(_border);

var _text = require('./text');

var _text2 = _interopRequireDefault(_text);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function textInput() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.invalidColor = options.invalidColor || 'Red';
  options.focusColor = options.focusColor || 'Grey';

  return [function (el) {
    return el.style.display = 'flex';
  }, function (el) {
    return el.style.flexDirection = 'column';
  }, function (el) {
    return el.style.alignItems = 'stretch';
  }, (0, _jsuaStyle.select)('input, textarea', [_text2.default.input(), function (el) {
    return el.style.backgroundColor = "inherit";
  }, function (el) {
    return el.style.outline = "none";
  }, function (el) {
    return el.style.border = "none";
  }, function (el) {
    return el.style.paddingBottom = "7px";
  }]), (0, _jsuaStyle.when)('normal', [function (el) {
    return el.style.display = 'flex';
  }, _border2.default.bottom({ theme: options.theme })]), (0, _jsuaStyle.when)('focus', _border2.default.bottom({ color: options.focusColor, width: '2px', opacity: 1 })), (0, _jsuaStyle.when)('validity', 'invalid', _border2.default.bottom({ color: options.invalidColor, opacity: 1 })), (0, _jsuaStyle.on)('focusin', (0, _jsuaStyle.setState)('focus')), (0, _jsuaStyle.on)('focusout', (0, _jsuaStyle.clearState)('focus')), (0, _jsuaStyle.when)('visibility', 'hidden', function (el) {
    return el.style.display = 'none';
  }), (0, _jsuaStyle.setState)('normal')];
}
},{"./border":66,"./text":91,"@lynx-json/jsua-style":98}],91:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = text;

var _jsuaStyle = require("@lynx-json/jsua-style");

var _colorPalette = require("./color-palette");

var colorPalette = _interopRequireWildcard(_colorPalette);

var _color = require("./color");

var _color2 = _interopRequireDefault(_color);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function text() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return [function (el) {
    return el.style.fontFamily = "Roboto, sans-serif";
  }, function (el) {
    return el.style.fontWeight = "400";
  }, function (el) {
    return el.style.fontSize = "14px";
  }];
}

text.display4 = function display4() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.opacity = options.opacity || (options.theme === "light" ? 0.7 : 0.54);

  return [(0, _color2.default)(options), function (el) {
    return el.style.fontWeight = "300";
  }, function (el) {
    return el.style.fontSize = "112px";
  }];
};

text.display3 = function display3() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.opacity = options.opacity || (options.theme === "light" ? 0.7 : 0.54);

  return [(0, _color2.default)(options), function (el) {
    return el.style.fontSize = "56px";
  }];
};

text.display2 = function display2() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.opacity = options.opacity || (options.theme === "light" ? 0.7 : 0.54);

  return [(0, _color2.default)(options), function (el) {
    return el.style.fontSize = "45px";
  }, function (el) {
    return el.style.lineHeight = "48px";
  }];
};

text.display = function display() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  options.opacity = options.opacity || (options.theme === "light" ? 0.7 : 0.54);

  return [(0, _color2.default)(options), function (el) {
    return el.style.fontSize = "34px";
  }, function (el) {
    return el.style.lineHeight = "40px";
  }];
};

text.headline = function headline() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return [function (el) {
    return el.style.fontSize = "24px";
  }, function (el) {
    return el.style.lineHeight = "32px";
  }];
};

text.title = function title() {
  return [function (el) {
    return el.style.fontWeight = "500";
  }, function (el) {
    return el.style.fontSize = "20px";
  }];
};

text.subheading2 = function subheading2() {
  return [function (el) {
    return el.style.fontSize = "16px";
  }, function (el) {
    return el.style.lineHeight = "28px";
  }];
};

text.subheading = function subheading() {
  return [function (el) {
    return el.style.fontSize = "16px";
  }, function (el) {
    return el.style.lineHeight = "24px";
  }];
};

text.body2 = function body2() {
  return [function (el) {
    return el.style.fontWeight = "500";
  }, function (el) {
    return el.style.fontSize = "14px";
  }, function (el) {
    return el.style.lineHeight = "28px";
  }];
};

text.body = function body() {
  return [function (el) {
    return el.style.fontSize = "14px";
  }, function (el) {
    return el.style.lineHeight = "24px";
  }];
};

text.caption = function caption() {
  return [function (el) {
    return el.style.fontSize = "12px";
  }, function (el) {
    return el.style.lineHeight = "14px";
  }];
};

text.button = function button() {
  return [function (el) {
    return el.style.fontSize = "14px";
  }, function (el) {
    return el.style.fontWeight = "500";
  }, function (el) {
    return el.style.textTransform = "uppercase";
  }];
};

text.input = function input() {
  return [function (el) {
    return el.style.fontSize = "16px";
  }, function (el) {
    return el.style.lineHeight = "18px";
  }];
};
},{"./color":69,"./color-palette":68,"@lynx-json/jsua-style":98}],92:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDividerStyle = getDividerStyle;
exports.wrapChildren = wrapChildren;
exports.clearChildren = clearChildren;
exports.findNearestAncestor = findNearestAncestor;
exports.raiseEvent = raiseEvent;
exports.rgba = rgba;

var _colorPalette = require("./color-palette");

var _colorPalette2 = _interopRequireDefault(_colorPalette);

var _jsuaStyle = require("@lynx-json/jsua-style");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getDividerStyle(textColor) {
  if (textColor === "white") {
    return "1px solid rgba(255, 255, 255, .12)";
  } else {
    return "1px solid rgba(0, 0, 0, .12)";
  }
}

function wrapChildren(element) {
  var wrapper = document.createElement("div");
  wrapper.setAttribute("role", "presentation");

  var children = [];
  for (var i = 0, max = element.childNodes.length; i < max; i++) {
    children.push(element.childNodes[i]);
  }

  children.forEach(function (child) {
    wrapper.appendChild(child);
  });

  element.appendChild(wrapper);
  return wrapper;
}

function matches(element, selector) {
  if (typeof selector === "function") return selector(element);
  return element.matches(selector);
}

function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function findNearestAncestor(element, selector) {
  var current = element.parentElement;

  while (current !== null && current !== undefined) {
    if (matches(current, selector)) return current;
    current = current.parentElement;
  }

  return null;
}

function raiseEvent(element, name, bubble, cancelable) {
  var evt = document.createEvent("Event");
  evt.initEvent(name, bubble, cancelable);
  element.dispatchEvent(evt);
}

function rgba(color, opacity) {
  color = parseInt(color.slice(1), 16);
  var r = color >> 16;
  var g = color >> 8 & 0x00FF;
  var b = color & 0x0000ff;

  return "rgba(" + r + ", " + g + ", " + b + ", " + opacity + ")";
}
},{"./color-palette":68,"@lynx-json/jsua-style":98}],93:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = view;

var _jsuaStyle = require('@lynx-json/jsua-style');

function view() {
  var innerHTML = '\n    <div role="presentation" data-jsua-style-slot="content" style="flex-grow: 1"></div>\n  ';
  return [(0, _jsuaStyle.filter)(_jsuaStyle.filters.not(_jsuaStyle.filters.has(_jsuaStyle.mappers.slot('content'))), [(0, _jsuaStyle.component)('material-view', innerHTML), function (el) {
    return el.style.flexDirection = 'column';
  }, function (el) {
    return el.style.alignItems = 'stretch';
  }, (0, _jsuaStyle.when)('normal', function (el) {
    return el.style.display = 'flex';
  }), (0, _jsuaStyle.when)('visibility', 'hidden', function (el) {
    return el.style.display = 'none';
  }), (0, _jsuaStyle.setState)('normal')])];
}
},{"@lynx-json/jsua-style":98}],94:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = adjust;

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function adjust(fn) {
  return function (element) {
    element.setAttribute("data-jsua-style-adjust", true);
    element.addEventListener("jsua-style-adjust", function () {
      (0, _query2.default)(element).each(fn);
    });
  };
}
},{"./query":105}],95:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = component;

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

var _selectors = require("./selectors");

var _mappers = require("./mappers");

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function component(name, innerHTML) {
  return function (element) {
    var slots = {};

    var existingGetSlotFn = element.jsuaStyleGetSlot;

    element.jsuaStyleGetSlot = function (slotName, componentName) {
      if (!componentName && slots[slotName]) return slots[slotName];

      if (componentName === name) {
        return slots[slotName];
      }

      if (existingGetSlotFn) return existingGetSlotFn(slotName, componentName);
    };

    function addToSlot(el) {
      var slotName = el.getAttribute("data-jsua-style-slot-name") || "content";

      if (slots[slotName]) {
        var slot = slots[slotName];
        if (slot.getAttribute("data-jsua-style-slot-mode") === "replace") {
          while (slot.firstChild) {
            slot.removeChild(slot.firstChild);
          }
        }

        slot.appendChild(el);
      }
    }

    element.jsuaStyleAddToSlot = addToSlot;

    if (innerHTML) {
      var componentTemplate = document.createElement("div");
      componentTemplate.innerHTML = innerHTML;

      (0, _query2.default)(componentTemplate).select("[data-jsua-style-slot]").each(function (slot) {
        return slots[slot.getAttribute("data-jsua-style-slot")] = slot;
      });

      var children = [];
      (0, _query2.default)(element).map(function (el) {
        return el.children;
      }).each(function (child) {
        children.push(child);
      });

      (0, _query2.default)(children).each(function (el) {
        return addToSlot(el);
      });

      while (componentTemplate.firstChild) {
        element.appendChild(componentTemplate.firstChild);
      }
    }

    element.addEventListener("jsua-style-slotted", function (evt) {
      if (evt.componentName !== name) return;
      addToSlot(evt.element);
    });

    (0, _util.addToken)(element, "data-jsua-style-component", name);
  };
}

// TODO: Remove this and all references. Deprecated in favor of the slot function.
component.slot = function (componentName, slotName) {
  return function (element) {
    element.setAttribute("data-jsua-style-slot-name", slotName);

    (0, _query2.default)(element).map((0, _mappers.ancestors)()).filter((0, _selectors.first)("[data-jsua-style-component]")).each(function (component) {
      var evt = document.createEvent("Event");
      evt.componentName = componentName;
      evt.element = element;
      evt.initEvent("jsua-style-slotted", false, false);
      component.dispatchEvent(evt);
    });
  };
};
},{"./mappers":101,"./query":105,"./selectors":107,"./util":110}],96:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = context;

var _util = require("./util");

function context(name) {
  return function (element) {
    (0, _util.addToken)(element, "data-jsua-context", name);
  };
}
},{"./util":110}],97:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = filter;

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function filter(filter, fn) {
  return function (result) {
    if (result.view) {
      // TODO: Test
      (0, _query2.default)(result.view).filter(filter).each(fn);
    } else {
      (0, _query2.default)(result).filter(filter).each(fn);
    }
  };
}
},{"./query":105}],98:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasToken = exports.addToken = exports.applyAdjustments = exports.adjust = exports.note = exports.media = exports.lock = exports.slot = exports.component = exports.filters = exports.selectors = exports.select = exports.filter = exports.map = exports.mappers = exports.whenNot = exports.when = exports.toggleState = exports.clearState = exports.setState = exports.off = exports.on = exports.query = exports.context = undefined;

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

var _on = require("./on");

var _state = require("./state");

var _mappers = require("./mappers");

var mappers = _interopRequireWildcard(_mappers);

var _selectors = require("./selectors");

var selectors = _interopRequireWildcard(_selectors);

var _context = require("./context");

var _context2 = _interopRequireDefault(_context);

var _component = require("./component");

var _component2 = _interopRequireDefault(_component);

var _slot = require("./slot");

var _slot2 = _interopRequireDefault(_slot);

var _lock = require("./lock");

var _lock2 = _interopRequireDefault(_lock);

var _map = require("./map");

var _map2 = _interopRequireDefault(_map);

var _filter = require("./filter");

var _filter2 = _interopRequireDefault(_filter);

var _select = require("./select");

var _select2 = _interopRequireDefault(_select);

var _media = require("./media");

var _media2 = _interopRequireDefault(_media);

var _note = require("./note");

var _note2 = _interopRequireDefault(_note);

var _adjust = require("./adjust");

var _adjust2 = _interopRequireDefault(_adjust);

var _util = require("./util");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var filters = selectors;

exports.context = _context2.default;
exports.query = _query2.default;
exports.on = _on.on;
exports.off = _on.off;
exports.setState = _state.setState;
exports.clearState = _state.clearState;
exports.toggleState = _state.toggleState;
exports.when = _state.when;
exports.whenNot = _state.whenNot;
exports.mappers = mappers;
exports.map = _map2.default;
exports.filter = _filter2.default;
exports.select = _select2.default;
exports.selectors = selectors;
exports.filters = filters;
exports.component = _component2.default;
exports.slot = _slot2.default;
exports.lock = _lock2.default;
exports.media = _media2.default;
exports.note = _note2.default;
exports.adjust = _adjust2.default;
exports.applyAdjustments = _util.applyAdjustments;
exports.addToken = _util.addToken;
exports.hasToken = _util.hasToken;
},{"./adjust":94,"./component":95,"./context":96,"./filter":97,"./lock":99,"./map":100,"./mappers":101,"./media":102,"./note":103,"./on":104,"./query":105,"./select":106,"./selectors":107,"./slot":108,"./state":109,"./util":110}],99:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = lock;

var _util = require("./util");

// TODO: Consider making fn argument obsolete.
function lock(keyOrFn) {
  var key, fn;

  if (typeof keyOrFn === "string") {
    key = keyOrFn;
  } else {
    key = "style";
    fn = keyOrFn;
  }

  return function (element) {
    // TODO: Obsolete?
    if (fn && !(0, _util.hasToken)(element, "data-jsua-style-lock", key)) {
      (0, _util.executeFunctionOrArrayOfFunctions)(fn, element);
    }

    (0, _util.addToken)(element, "data-jsua-style-lock", key);
  };
}
},{"./util":110}],100:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = map;

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function map(mapper, fn) {
  return function (result) {
    if (result.view) {
      // TODO: Test
      (0, _query2.default)(result.view).map(mapper).each(fn);
    } else {
      (0, _query2.default)(result).map(mapper).each(fn);
    }
  };
}
},{"./query":105}],101:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.previousSibling = previousSibling;
exports.previousRealSibling = previousRealSibling;
exports.previousSiblings = previousSiblings;
exports.nextSibling = nextSibling;
exports.nextRealSibling = nextRealSibling;
exports.nextSiblings = nextSiblings;
exports.ancestors = ancestors;
exports.descendants = descendants;
exports.realChildren = realChildren;
exports.children = children;
exports.realParent = realParent;
exports.parent = parent;
exports.slot = slot;
exports.component = component;
exports.wrapper = wrapper;
exports.first = first;
exports.nth = nth;
exports.even = even;
exports.odd = odd;
exports.last = last;

var _util = require("./util");

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//TODO: Test
function previousSibling(selector) {
  selector = selector || "*";

  return function (el) {
    var previousSibling = el.previousElementSibling;

    if (previousSibling && (0, _util.matches)(selector, previousSibling)) {
      return previousSibling;
    }
  };
}

// TODO: Test
function previousRealSibling(selector) {
  selector = selector || "*";

  return function (el) {
    var siblings = (0, _query2.default)(el).map(realParent()).map(realChildren()).toArray();

    if (siblings.length > 0) {
      var index = siblings.indexOf(el);
      var matches = (0, _query2.default)(siblings).filter(function (el) {
        return siblings.indexOf(el) < index;
      }).filter(selector).toArray();
      if (matches.length > 0) {
        return matches[matches.length - 1];
      }
    }
  };
}

function previousSiblings(selector) {
  selector = selector || "*";

  return (/*#__PURE__*/regeneratorRuntime.mark(function _callee(el) {
      var previousSibling;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              previousSibling = el.previousElementSibling;

            case 1:
              if (!previousSibling) {
                _context.next = 8;
                break;
              }

              if (!(0, _util.matches)(selector, previousSibling)) {
                _context.next = 5;
                break;
              }

              _context.next = 5;
              return previousSibling;

            case 5:
              previousSibling = previousSibling.previousElementSibling;
              _context.next = 1;
              break;

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    })
  );
}

// TODO: Test
function nextSibling(selector) {
  selector = selector || "*";

  return function (el) {
    var nextSibling = el.nextElementSibling;

    if (nextSibling && (0, _util.matches)(selector, nextSibling)) {
      return nextSibling;
    }
  };
}

// TODO: Test
function nextRealSibling(selector) {
  selector = selector || "*";

  return function (el) {
    var siblings = (0, _query2.default)(el).map(realParent()).map(realChildren()).toArray();

    if (siblings.length > 0) {
      var index = siblings.indexOf(el);
      var matches = (0, _query2.default)(siblings).filter(function (el) {
        return siblings.indexOf(el) > index;
      }).filter(selector).toArray();
      if (matches.length > 0) {
        return matches[0];
      }
    }
  };
}

function nextSiblings(selector) {
  selector = selector || "*";

  return (/*#__PURE__*/regeneratorRuntime.mark(function _callee2(el) {
      var nextSibling;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              nextSibling = el.nextElementSibling;

            case 1:
              if (!nextSibling) {
                _context2.next = 8;
                break;
              }

              if (!(0, _util.matches)(selector, nextSibling)) {
                _context2.next = 5;
                break;
              }

              _context2.next = 5;
              return nextSibling;

            case 5:
              nextSibling = nextSibling.nextElementSibling;
              _context2.next = 1;
              break;

            case 8:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    })
  );
}

function ancestors(selector) {
  selector = selector || "*";

  return (/*#__PURE__*/regeneratorRuntime.mark(function _callee3(el) {
      var ancestor;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              ancestor = el.parentElement;

            case 1:
              if (!ancestor) {
                _context3.next = 8;
                break;
              }

              if (!(0, _util.matches)(selector, ancestor)) {
                _context3.next = 5;
                break;
              }

              _context3.next = 5;
              return ancestor;

            case 5:
              ancestor = ancestor.parentElement;
              _context3.next = 1;
              break;

            case 8:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    })
  );
}

function descendants(selector) {
  selector = selector || "*";

  return (/*#__PURE__*/regeneratorRuntime.mark(function _callee4(el) {
      var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, descendant;

      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (!(typeof selector === "function")) {
                _context4.next = 30;
                break;
              }

              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context4.prev = 4;
              _iterator = el.querySelectorAll("*")[Symbol.iterator]();

            case 6:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context4.next = 14;
                break;
              }

              descendant = _step.value;

              if (!selector(descendant)) {
                _context4.next = 11;
                break;
              }

              _context4.next = 11;
              return descendant;

            case 11:
              _iteratorNormalCompletion = true;
              _context4.next = 6;
              break;

            case 14:
              _context4.next = 20;
              break;

            case 16:
              _context4.prev = 16;
              _context4.t0 = _context4["catch"](4);
              _didIteratorError = true;
              _iteratorError = _context4.t0;

            case 20:
              _context4.prev = 20;
              _context4.prev = 21;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 23:
              _context4.prev = 23;

              if (!_didIteratorError) {
                _context4.next = 26;
                break;
              }

              throw _iteratorError;

            case 26:
              return _context4.finish(23);

            case 27:
              return _context4.finish(20);

            case 28:
              _context4.next = 31;
              break;

            case 30:
              return _context4.delegateYield(el.querySelectorAll(selector), "t1", 31);

            case 31:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this, [[4, 16, 20, 28], [21,, 23, 27]]);
    })
  );
}

function realChildren(selector, excludeFilter) {
  var _marked = /*#__PURE__*/regeneratorRuntime.mark(getChildren);

  selector = selector || "*";

  function getChildren(el) {
    var i, max, child;
    return regeneratorRuntime.wrap(function getChildren$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            i = 0, max = el.children.length;

          case 1:
            if (!(i < max)) {
              _context5.next = 17;
              break;
            }

            child = el.children[i];

            if (!(child.getAttribute("role") === "presentation")) {
              _context5.next = 7;
              break;
            }

            return _context5.delegateYield(getChildren(child), "t0", 5);

          case 5:
            _context5.next = 14;
            break;

          case 7:
            if (!(excludeFilter && (0, _util.matches)(excludeFilter, child))) {
              _context5.next = 11;
              break;
            }

            return _context5.delegateYield(getChildren(child), "t1", 9);

          case 9:
            _context5.next = 14;
            break;

          case 11:
            if (!(0, _util.matches)(selector, child)) {
              _context5.next = 14;
              break;
            }

            _context5.next = 14;
            return child;

          case 14:
            i++;
            _context5.next = 1;
            break;

          case 17:
          case "end":
            return _context5.stop();
        }
      }
    }, _marked, this);
  }

  return function (el) {
    // We can't return the iterable directly,
    // because it's possible that the structure changes
    // as a result of styling.
    return Array.from(getChildren(el));
  };
}

function children(selector) {
  var _marked2 = /*#__PURE__*/regeneratorRuntime.mark(getChildren);

  selector = selector || "*";

  function getChildren(el) {
    var i, max, child;
    return regeneratorRuntime.wrap(function getChildren$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            i = 0, max = el.children.length;

          case 1:
            if (!(i < max)) {
              _context6.next = 9;
              break;
            }

            child = el.children[i];

            if (!(0, _util.matches)(selector, child)) {
              _context6.next = 6;
              break;
            }

            _context6.next = 6;
            return child;

          case 6:
            i++;
            _context6.next = 1;
            break;

          case 9:
          case "end":
            return _context6.stop();
        }
      }
    }, _marked2, this);
  }

  return function (el) {
    // We can't return the iterable directly,
    // because it's possible that the structure changes
    // as a result of styling.
    return Array.from(getChildren(el));
  };
}

function realParent(selector, excludeFilter) {
  selector = selector || "*";

  return function (el) {
    while (el = el.parentElement) {
      var exclude = el.getAttribute("role") === "presentation" || excludeFilter && (0, _util.matches)(excludeFilter, el);
      if (!exclude && (0, _util.matches)(selector, el)) {
        return el;
      } else if (!exclude) {
        break;
      }
    }

    return null;
  };
}

function parent(selector) {
  selector = selector || "*";

  return function (el) {
    if (el.parentElement && (0, _util.matches)(selector, el.parentElement)) {
      return el.parentElement;
    }

    return null;
  };
}

function slot(slotName, componentName) {
  return function (el) {
    return el.jsuaStyleGetSlot && el.jsuaStyleGetSlot(slotName, componentName);
  };
}

// TODO: TEST
function component(name) {
  var selector = name ? "[data-jsua-style-component~='" + name + "']" : "[data-jsua-style-component]";

  return first(ancestors(selector));
}

function wrapper() {
  return function (el) {
    var wrapperElement = document.createElement("div");
    wrapperElement.setAttribute("role", "presentation");

    el.parentElement.replaceChild(wrapperElement, el);
    wrapperElement.appendChild(el);

    return wrapperElement;
  };
}

function first(mapper) {
  return function (el) {
    var matches = (0, _query2.default)(el).map(mapper).toArray();
    return matches.length > 0 && matches[0];
  };
}

function nth(number, mapper) {
  return function (el) {
    var matches = (0, _query2.default)(el).map(mapper).toArray();
    return matches.length >= number && matches[number - 1];
  };
}

function even(mapper) {
  var _marked3 = /*#__PURE__*/regeneratorRuntime.mark(getResults);

  function getResults(el) {
    var matches, i, max;
    return regeneratorRuntime.wrap(function getResults$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            matches = (0, _query2.default)(el).map(mapper).toArray();
            i = 1, max = matches.length + 1;

          case 2:
            if (!(i < max)) {
              _context7.next = 9;
              break;
            }

            if (!(i % 2 === 0)) {
              _context7.next = 6;
              break;
            }

            _context7.next = 6;
            return matches[i - 1];

          case 6:
            i++;
            _context7.next = 2;
            break;

          case 9:
          case "end":
            return _context7.stop();
        }
      }
    }, _marked3, this);
  }

  return function (el) {
    return Array.from(getResults(el));
  };
}

function odd(mapper) {
  var _marked4 = /*#__PURE__*/regeneratorRuntime.mark(getResults);

  function getResults(el) {
    var matches, i, max;
    return regeneratorRuntime.wrap(function getResults$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            matches = (0, _query2.default)(el).map(mapper).toArray();
            i = 1, max = matches.length + 1;

          case 2:
            if (!(i < max)) {
              _context8.next = 9;
              break;
            }

            if (!(i % 2 !== 0)) {
              _context8.next = 6;
              break;
            }

            _context8.next = 6;
            return matches[i - 1];

          case 6:
            i++;
            _context8.next = 2;
            break;

          case 9:
          case "end":
            return _context8.stop();
        }
      }
    }, _marked4, this);
  }

  return function (el) {
    return Array.from(getResults(el));
  };
}

function last(mapper) {
  return function (el) {
    var matches = (0, _query2.default)(el).map(mapper).toArray();
    return matches.length > 0 && matches[matches.length - 1];
  };
}
},{"./query":105,"./util":110}],102:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = media;

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mediaQueries;

function hasMediaContextChanged() {
  var change = false;

  for (var mq in mediaQueries) {
    var matches = window.matchMedia(mq).matches;
    if (mediaQueries[mq] !== matches) {
      mediaQueries[mq] = matches;
      change = true;
    }
  }

  return change;
}

function initialize() {
  mediaQueries = {};
  window.addEventListener("resize", function () {
    if (!hasMediaContextChanged()) return;

    var responsiveElements = Array.from(document.querySelectorAll("[data-jsua-style-responsive]"));

    responsiveElements.forEach(function applyResponsiveStyles(element) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = element.jsuaStyleResponsiveStyles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var style = _step.value;

          if (window.matchMedia(style.mediaQuery).matches) {
            (0, _query2.default)(element).each(style.fn);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    });

    (0, _util.applyAdjustments)();
  });
}

function media(mediaQuery, fn) {
  if (!mediaQueries) {
    initialize();
  }

  mediaQueries[mediaQuery] = window.matchMedia(mediaQuery).matches;

  return function (element) {
    element.jsuaStyleResponsiveStyles = element.jsuaStyleResponsiveStyles || [];
    element.jsuaStyleResponsiveStyles.push({
      mediaQuery: mediaQuery,
      fn: fn
    });
    element.setAttribute("data-jsua-style-responsive", true);

    if (window.matchMedia(mediaQuery).matches) {
      (0, _query2.default)(element).each(fn);
    }
  };
}
},{"./query":105,"./util":110}],103:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = note;

var _util = require("./util");

function note(text) {
  return function (element) {
    (0, _util.addToken)(element, "data-jsua-style-notes", text);
  };
}
},{"./util":110}],104:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.on = on;
exports.off = off;

var _util = require("./util");

function on(name, fn) {
  return function (el) {
    function handler(e) {
      (0, _util.executeFunctionOrArrayOfFunctions)(fn, el, e);
    }

    var previousFn = el["jsuaStyleOff" + name];

    el["jsuaStyleOff" + name] = function () {
      el.removeEventListener(name, handler);

      if (previousFn) {
        previousFn();
      }
    };

    el.addEventListener(name, handler);
  };
}

function off(name) {
  return function (el) {
    if (el["jsuaStyleOff" + name]) {
      el["jsuaStyleOff" + name]();
    }
  };
}
},{"./util":110}],105:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = query;

var _util = require("./util");

var _marked = /*#__PURE__*/regeneratorRuntime.mark(filter),
    _marked2 = /*#__PURE__*/regeneratorRuntime.mark(select),
    _marked3 = /*#__PURE__*/regeneratorRuntime.mark(map);

function filter(selector, selection) {
  var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, e;

  return regeneratorRuntime.wrap(function filter$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 3;
          _iterator = selection[Symbol.iterator]();

        case 5:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 13;
            break;
          }

          e = _step.value;

          if (!(0, _util.matches)(selector, e)) {
            _context.next = 10;
            break;
          }

          _context.next = 10;
          return e;

        case 10:
          _iteratorNormalCompletion = true;
          _context.next = 5;
          break;

        case 13:
          _context.next = 19;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](3);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 19:
          _context.prev = 19;
          _context.prev = 20;

          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }

        case 22:
          _context.prev = 22;

          if (!_didIteratorError) {
            _context.next = 25;
            break;
          }

          throw _iteratorError;

        case 25:
          return _context.finish(22);

        case 26:
          return _context.finish(19);

        case 27:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, this, [[3, 15, 19, 27], [20,, 22, 26]]);
}

function each(fn, selection) {
  var executedElements = [];
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = filter(function (el) {
      return el !== null && executedElements.indexOf(el) === -1;
    }, selection)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var el = _step2.value;

      (0, _util.executeFunctionOrArrayOfFunctions)(fn, el);
      executedElements.push(el);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return executedElements;
}

function select(selector, selection) {
  var _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, e, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, descendant;

  return regeneratorRuntime.wrap(function select$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _iteratorNormalCompletion3 = true;
          _didIteratorError3 = false;
          _iteratorError3 = undefined;
          _context2.prev = 3;
          _iterator3 = selection[Symbol.iterator]();

        case 5:
          if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
            _context2.next = 46;
            break;
          }

          e = _step3.value;

          if (e) {
            _context2.next = 9;
            break;
          }

          return _context2.abrupt("continue", 43);

        case 9:
          if (!(0, _util.matches)(selector, e)) {
            _context2.next = 12;
            break;
          }

          _context2.next = 12;
          return e;

        case 12:
          if (!(typeof selector === "function")) {
            _context2.next = 42;
            break;
          }

          _iteratorNormalCompletion4 = true;
          _didIteratorError4 = false;
          _iteratorError4 = undefined;
          _context2.prev = 16;
          _iterator4 = e.querySelectorAll("*")[Symbol.iterator]();

        case 18:
          if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
            _context2.next = 26;
            break;
          }

          descendant = _step4.value;

          if (!selector(descendant)) {
            _context2.next = 23;
            break;
          }

          _context2.next = 23;
          return descendant;

        case 23:
          _iteratorNormalCompletion4 = true;
          _context2.next = 18;
          break;

        case 26:
          _context2.next = 32;
          break;

        case 28:
          _context2.prev = 28;
          _context2.t0 = _context2["catch"](16);
          _didIteratorError4 = true;
          _iteratorError4 = _context2.t0;

        case 32:
          _context2.prev = 32;
          _context2.prev = 33;

          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }

        case 35:
          _context2.prev = 35;

          if (!_didIteratorError4) {
            _context2.next = 38;
            break;
          }

          throw _iteratorError4;

        case 38:
          return _context2.finish(35);

        case 39:
          return _context2.finish(32);

        case 40:
          _context2.next = 43;
          break;

        case 42:
          return _context2.delegateYield(e.querySelectorAll(selector), "t1", 43);

        case 43:
          _iteratorNormalCompletion3 = true;
          _context2.next = 5;
          break;

        case 46:
          _context2.next = 52;
          break;

        case 48:
          _context2.prev = 48;
          _context2.t2 = _context2["catch"](3);
          _didIteratorError3 = true;
          _iteratorError3 = _context2.t2;

        case 52:
          _context2.prev = 52;
          _context2.prev = 53;

          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }

        case 55:
          _context2.prev = 55;

          if (!_didIteratorError3) {
            _context2.next = 58;
            break;
          }

          throw _iteratorError3;

        case 58:
          return _context2.finish(55);

        case 59:
          return _context2.finish(52);

        case 60:
        case "end":
          return _context2.stop();
      }
    }
  }, _marked2, this, [[3, 48, 52, 60], [16, 28, 32, 40], [33,, 35, 39], [53,, 55, 59]]);
}

function map(fn, selection) {
  var _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, e, result;

  return regeneratorRuntime.wrap(function map$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (!(fn === null || fn === undefined)) {
            _context3.next = 2;
            break;
          }

          return _context3.abrupt("return");

        case 2:
          _iteratorNormalCompletion5 = true;
          _didIteratorError5 = false;
          _iteratorError5 = undefined;
          _context3.prev = 5;
          _iterator5 = selection[Symbol.iterator]();

        case 7:
          if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
            _context3.next = 22;
            break;
          }

          e = _step5.value;

          if (typeof fn !== "function") {
            console.error("Attempting to map using a non-function:", fn);
          }

          result = fn(e);

          if (result) {
            _context3.next = 13;
            break;
          }

          return _context3.abrupt("continue", 19);

        case 13:
          if (!result.tagName) {
            _context3.next = 18;
            break;
          }

          _context3.next = 16;
          return result;

        case 16:
          _context3.next = 19;
          break;

        case 18:
          return _context3.delegateYield(result, "t0", 19);

        case 19:
          _iteratorNormalCompletion5 = true;
          _context3.next = 7;
          break;

        case 22:
          _context3.next = 28;
          break;

        case 24:
          _context3.prev = 24;
          _context3.t1 = _context3["catch"](5);
          _didIteratorError5 = true;
          _iteratorError5 = _context3.t1;

        case 28:
          _context3.prev = 28;
          _context3.prev = 29;

          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }

        case 31:
          _context3.prev = 31;

          if (!_didIteratorError5) {
            _context3.next = 34;
            break;
          }

          throw _iteratorError5;

        case 34:
          return _context3.finish(31);

        case 35:
          return _context3.finish(28);

        case 36:
        case "end":
          return _context3.stop();
      }
    }
  }, _marked3, this, [[5, 24, 28, 36], [29,, 31, 35]]);
}

function query(selection) {
  if (selection.querySelector) {
    selection = [selection];
  }

  var q = {};

  q.each = function (fn) {
    selection = each(fn, selection);

    return q;
  };

  q.toArray = function () {
    var a = [];
    each(function (el) {
      return a.push(el);
    }, selection);
    return a;
  };

  q.select = function (selector) {
    selection = select(selector, selection);
    return q;
  };

  q.map = function (mapFn) {
    selection = map(mapFn, selection);
    return q;
  };

  q.filter = function (selector) {
    selection = filter(selector, selection);
    return q;
  };

  return q;
}
},{"./util":110}],106:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = select;

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function select(selector, fn) {
  return function (result) {
    if (result.view) {
      (0, _query2.default)(result.view).select(selector).each(fn);
    } else {
      (0, _query2.default)(result).select(selector).each(fn);
    }
  };
}
},{"./query":105}],107:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.firstChild = firstChild;
exports.not = not;
exports.lastChild = lastChild;
exports.nthChild = nthChild;
exports.first = first;
exports.has = has;
exports.hasOne = hasOne;
exports.matchesMedia = matchesMedia;
exports.hasParent = hasParent;
exports.hasRealParent = hasRealParent;
exports.isHidden = isHidden;
exports.unlocked = unlocked;

var _util = require("./util");

var _mappers = require("./mappers");

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function firstChild(selector) {
  selector = selector || "*";
  return function (element) {
    if (!element.parentElement) return false;
    if (!(0, _util.matches)(selector, element)) return false;

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = (0, _mappers.previousSiblings)()(element)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var s = _step.value;

        if ((0, _util.matches)(selector, s)) return false;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return true;
  };
}

function not(selector) {
  selector = selector || "*";

  return function (element) {
    if ((0, _util.matches)(selector, element)) {
      return false;
    }

    return true;
  };
}

function lastChild(selector) {
  selector = selector || "*";
  return function (element) {
    if (!element.parentElement) return false;
    if (!(0, _util.matches)(selector, element)) return false;

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = (0, _mappers.nextSiblings)()(element)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var s = _step2.value;

        if ((0, _util.matches)(selector, s)) return false;
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return true;
  };
}

// Obsolete
function nthChild(index, selector) {
  selector = selector || "*";
  return function (element) {
    if (!element.parentElement) return false;
    if (!(0, _util.matches)(selector, element)) return false;

    var count = 0;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = (0, _mappers.previousSiblings)()(element)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var s = _step3.value;

        if ((0, _util.matches)(selector, s)) count += 1;
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return count === index;
  };
}

function first(selector) {
  selector = selector || "*";

  var found = false;
  return function (element) {
    if (found) return false;

    if ((0, _util.matches)(selector, element)) {
      found = true;
      return true;
    }
  };
}

function has(mapperOrNumber, mapper) {
  var number;
  if (typeof mapperOrNumber === "number") {
    number = mapperOrNumber;
  } else {
    mapper = mapperOrNumber;
  }

  return function (element) {
    var matches = (0, _query2.default)(element).map(mapper).toArray();

    if (number !== undefined) {
      return matches.length === number;
    }

    return matches.length > 0;
  };
}

function hasOne(mapper) {
  return function (element) {
    var matches = (0, _query2.default)(element).map(mapper).toArray();
    return matches.length === 1;
  };
}

function matchesMedia(mediaQuery) {
  return function (el) {
    if (window.matchMedia(mediaQuery).matches) return el;
  };
}

// Obsolete
function hasParent(selector) {
  selector = selector || "*";
  return function (element) {
    var matchingParent = (0, _mappers.parent)(selector)(element);
    return !!matchingParent;
  };
}

// Obsolete
function hasRealParent(selector) {
  selector = selector || "*";
  return function (element) {
    var matchingParent = (0, _mappers.realParent)(selector)(element);

    return !!matchingParent;
  };
}

function isHidden() {
  return function (element) {
    return element.jsuaStyleHasState && element.jsuaStyleHasState("visibility", "hidden");
  };
}

function unlocked(key, selector) {
  if (!selector) {
    selector = key;
    key = null;
  }

  key = key || "style";
  selector = selector || "*";

  return function (element) {
    if (!(0, _util.matches)(selector, element)) return false;
    return !(0, _util.hasToken)(element, "data-jsua-style-lock", key);
  };
}
},{"./mappers":101,"./query":105,"./util":110}],108:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = slot;

var _query = require("./query");

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function slot(name, mapper) {
  return function (component) {
    (0, _query2.default)(component).map(mapper).each([function (el) {
      return el.setAttribute("data-jsua-style-slot-name", name);
    }, function (el) {
      return component.jsuaStyleAddToSlot(el);
    }]);
  };
}
},{"./query":105}],109:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setState = setState;
exports.toggleState = toggleState;
exports.clearState = clearState;
exports.when = when;
exports.whenNot = whenNot;

var _util = require("./util");

function setupState(element) {
  var states = {};

  element.jsuaStyleHasState = function (state, value) {
    if (value === undefined) value = true;
    return state in states && states[state] === value;
  };

  element.jsuaStyleSetState = function (state, value) {
    if (value === undefined) value = true;
    states[state] = value;
  };

  element.jsuaStyleClearState = function (state) {
    delete states[state];
  };
}

function isTrackingState(element) {
  return !!element.jsuaStyleHasState;
}

function raiseChangeEvent(element, state, cleared) {
  var evt = document.createEvent("Event");
  evt.initEvent("jsua-style-state-change", false, false);
  evt.jsuaStyleState = state;
  evt.jsuaStyleStateCleared = !!cleared;

  element.dispatchEvent(evt);
}

function setState(state, value) {
  return function (element) {
    if (!isTrackingState(element)) {
      setupState(element);
    }

    if (element.jsuaStyleHasState(state, value)) return;

    element.jsuaStyleSetState(state, value);
    raiseChangeEvent(element, state);
  };
}

// TODO: Test
function toggleState(state) {
  return function (element) {
    if (!isTrackingState(element)) {
      setupState(element);
    }

    if (element.jsuaStyleHasState(state)) {
      clearState(state)(element);
    } else {
      setState(state)(element);
    }
  };
}

function clearState(state) {
  return function (element) {
    if (!isTrackingState(element)) {
      setupState(element);
    }

    if (!element.jsuaStyleHasState(state)) return;

    element.jsuaStyleClearState(state);
    raiseChangeEvent(element, state, true);
  };
}

function when(state, valueOrFn, fn) {
  var value = true;
  if (fn === undefined && (typeof valueOrFn === "function" || Array.isArray(valueOrFn))) {
    fn = valueOrFn;
  } else {
    value = valueOrFn;
  }

  return function (element) {
    if (element.jsuaStyleHasState && element.jsuaStyleHasState(state, value)) {
      (0, _util.executeFunctionOrArrayOfFunctions)(fn, element);
    }
    element.addEventListener("jsua-style-state-change", function (e) {
      if (element.jsuaStyleHasState(state, value)) {
        (0, _util.executeFunctionOrArrayOfFunctions)(fn, element, e);
      }
    });
  };
}

function whenNot(state, valueOrFn, fn) {
  var value = true;
  if (fn === undefined && (typeof valueOrFn === "function" || Array.isArray(valueOrFn))) {
    fn = valueOrFn;
  } else {
    value = valueOrFn;
  }

  return function (element) {
    if (!element.jsuaStyleHasState || !element.jsuaStyleHasState(state, value)) {
      (0, _util.executeFunctionOrArrayOfFunctions)(fn, element);
    }
    element.addEventListener("jsua-style-state-change", function (e) {
      if (!element.jsuaStyleHasState(state, value)) {
        (0, _util.executeFunctionOrArrayOfFunctions)(fn, element, e);
      }
    });
  };
}
},{"./util":110}],110:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeFunctionOrArrayOfFunctions = executeFunctionOrArrayOfFunctions;
exports.matches = matches;
exports.previousSiblings = previousSiblings;
exports.nextSiblings = nextSiblings;
exports.hasToken = hasToken;
exports.addToken = addToken;
exports.applyAdjustments = applyAdjustments;

var _marked = /*#__PURE__*/regeneratorRuntime.mark(previousSiblings),
    _marked2 = /*#__PURE__*/regeneratorRuntime.mark(nextSiblings);

function executeFunctionOrArrayOfFunctions(fn, element, evt) {
  if (Array.isArray(fn)) {
    return fn.forEach(function (f) {
      return executeFunctionOrArrayOfFunctions(f, element, evt);
    });
  }

  if (typeof fn !== "function") {
    console.error("Attempting to execute a non-function:", fn);
  }

  fn(element, evt);
}

function matches(selector, element) {
  if (typeof selector === "function") return selector(element);
  return element.matches(selector);
}

function previousSiblings(el) {
  var previousSibling;
  return regeneratorRuntime.wrap(function previousSiblings$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          previousSibling = el.previousElementSibling;

        case 1:
          if (!previousSibling) {
            _context.next = 7;
            break;
          }

          _context.next = 4;
          return previousSibling;

        case 4:
          previousSibling = previousSibling.previousElementSibling;
          _context.next = 1;
          break;

        case 7:
        case "end":
          return _context.stop();
      }
    }
  }, _marked, this);
}

function nextSiblings(el) {
  var nextSibling;
  return regeneratorRuntime.wrap(function nextSiblings$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          nextSibling = el.nextElementSibling;

        case 1:
          if (!nextSibling) {
            _context2.next = 7;
            break;
          }

          _context2.next = 4;
          return nextSibling;

        case 4:
          nextSibling = nextSibling.nextElementSibling;
          _context2.next = 1;
          break;

        case 7:
        case "end":
          return _context2.stop();
      }
    }
  }, _marked2, this);
}

function getTokens(view, attributeName) {
  var tokens = view.getAttribute(attributeName);
  return tokens ? tokens.split(" ") : [];
}

function hasToken(view, attributeName, token) {
  var tokens = getTokens(view, attributeName);

  if (token) {
    return tokens.some(function (t) {
      return t === token;
    });
  } else {
    return tokens.length > 0;
  }
}

function setTokens(view, attributeName, tokens) {
  tokens = tokens || [];
  view.setAttribute(attributeName, tokens.join(" "));
}

function addToken(element, attributeName, token) {
  var tokens = getTokens(element, attributeName);
  if (tokens.indexOf(token) > -1) return;
  tokens.push(token);
  setTokens(element, attributeName, tokens);
}

function applyAdjustments() {
  function apply(element) {
    var evt = document.createEvent("Event");
    evt.initEvent("jsua-style-adjust", false, false);
    element.dispatchEvent(evt);
  }

  Array.from(document.body.querySelectorAll("[data-jsua-style-adjust]")).reverse().forEach(apply);
}
},{}]},{},[51]);
