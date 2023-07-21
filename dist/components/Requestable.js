'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _jsBase = require('js-base64');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @copyright  2016 Yahoo Inc.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *             Github.js is freely distributable.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var log = (0, _debug2.default)('github:request');

/**
 * The error structure returned when a network call fails
 */

var ResponseError = function (_Error) {
   _inherits(ResponseError, _Error);

   /**
    * Construct a new ResponseError
    * @param {string} message - an message to return instead of the the default error message
    * @param {string} path - the requested path
    * @param {Object} response - the object returned by Axios
    */
   function ResponseError(message, path, response) {
      _classCallCheck(this, ResponseError);

      var _this = _possibleConstructorReturn(this, (ResponseError.__proto__ || Object.getPrototypeOf(ResponseError)).call(this, message));

      _this.path = path;
      _this.request = response.config;
      _this.response = (response || {}).response || response;
      _this.status = response.status;
      return _this;
   }

   return ResponseError;
}(Error);

/**
 * Requestable wraps the logic for making http requests to the API
 */


var Requestable = function () {
   /**
    * Either a username and password or an oauth token for Github
    * @typedef {Object} Requestable.auth
    * @prop {string} [username] - the Github username
    * @prop {string} [password] - the user's password
    * @prop {token} [token] - an OAuth token
    */
   /**
    * Initialize the http internals.
    * @param {Requestable.auth} [auth] - the credentials to authenticate to Github. If auth is
    *                                  not provided request will be made unauthenticated
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    * @param {string} [AcceptHeader=v3] - the accept header for the requests
    */
   function Requestable(auth, apiBase, AcceptHeader) {
      _classCallCheck(this, Requestable);

      this.__apiBase = apiBase || 'https://api.github.com';
      this.__auth = {
         token: auth.token,
         username: auth.username,
         password: auth.password
      };
      this.__AcceptHeader = AcceptHeader || 'v3';

      if (auth.token) {
         this.__authorizationHeader = 'token ' + auth.token;
      } else if (auth.username && auth.password) {
         this.__authorizationHeader = 'Basic ' + _jsBase.Base64.encode(auth.username + ':' + auth.password);
      }
   }

   /**
    * Compute the URL to use to make a request.
    * @private
    * @param {string} path - either a URL relative to the API base or an absolute URL
    * @return {string} - the URL to use
    */


   _createClass(Requestable, [{
      key: '__getURL',
      value: function __getURL(path) {
         var url = path;

         if (path.indexOf('//') === -1) {
            url = this.__apiBase + path;
         }

         var newCacheBuster = 'timestamp=' + new Date().getTime();
         return url.replace(/(timestamp=\d+)/, newCacheBuster);
      }

      /**
       * Compute the headers required for an API request.
       * @private
       * @param {boolean} raw - if the request should be treated as JSON or as a raw request
       * @param {string} AcceptHeader - the accept header for the request
       * @return {Object} - the headers to use in the request
       */

   }, {
      key: '__getRequestHeaders',
      value: function __getRequestHeaders(raw, AcceptHeader) {
         var headers = {
            'Content-Type': 'application/json;charset=UTF-8',
            'Accept': 'application/vnd.github.' + (AcceptHeader || this.__AcceptHeader)
         };

         if (raw) {
            headers.Accept += '.raw';
         }
         headers.Accept += '+json';

         if (this.__authorizationHeader) {
            headers.Authorization = this.__authorizationHeader;
         }

         return headers;
      }

      /**
       * Sets the default options for API requests
       * @protected
       * @param {Object} [requestOptions={}] - the current options for the request
       * @return {Object} - the options to pass to the request
       */

   }, {
      key: '_getOptionsWithDefaults',
      value: function _getOptionsWithDefaults() {
         var requestOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

         if (!(requestOptions.visibility || requestOptions.affiliation)) {
            requestOptions.type = requestOptions.type || 'all';
         }
         requestOptions.sort = requestOptions.sort || 'updated';
         requestOptions.per_page = requestOptions.per_page || '100'; // eslint-disable-line

         return requestOptions;
      }

      /**
       * if a `Date` is passed to this function it will be converted to an ISO string
       * @param {*} date - the object to attempt to coerce into an ISO date string
       * @return {string} - the ISO representation of `date` or whatever was passed in if it was not a date
       */

   }, {
      key: '_dateToISO',
      value: function _dateToISO(date) {
         if (date && date instanceof Date) {
            date = date.toISOString();
         }

         return date;
      }

      /**
       * A function that receives the result of the API request.
       * @callback Requestable.callback
       * @param {Requestable.Error} error - the error returned by the API or `null`
       * @param {(Object|true)} result - the data returned by the API or `true` if the API returns `204 No Content`
       * @param {Object} request - the raw {@linkcode https://github.com/mzabriskie/axios#response-schema Response}
       */
      /**
       * Make a request.
       * @param {string} method - the method for the request (GET, PUT, POST, DELETE)
       * @param {string} path - the path for the request
       * @param {*} [data] - the data to send to the server. For HTTP methods that don't have a body the data
       *                   will be sent as query parameters
       * @param {Requestable.callback} [cb] - the callback for the request
       * @param {boolean} [raw=false] - if the request should be sent as raw. If this is a falsy value then the
       *                              request will be made as JSON
       * @return {Promise} - the Promise for the http request
       */

   }, {
      key: '_request',
      value: function _request(method, path, data, cb, raw) {
         var url = this.__getURL(path);

         var AcceptHeader = (data || {}).AcceptHeader;
         if (AcceptHeader) {
            delete data.AcceptHeader;
         }
         var headers = this.__getRequestHeaders(raw, AcceptHeader);

         var queryParams = {};

         var shouldUseDataAsParams = data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && methodHasNoBody(method);
         if (shouldUseDataAsParams) {
            queryParams = data;
            data = undefined;
         }

         var config = {
            url: url,
            method: method,
            headers: headers,
            params: queryParams,
            data: data,
            responseType: raw ? 'text' : 'json'
         };

         log(config.method + ' to ' + config.url);
         var requestPromise = (0, _axios2.default)(config).catch(callbackErrorOrThrow(cb, path));

         if (cb) {
            requestPromise.then(function (response) {
               if (response.data && Object.keys(response.data).length > 0) {
                  // When data has results
                  cb(null, response.data, response);
               } else if (config.method !== 'GET' && Object.keys(response.data).length < 1) {
                  // True when successful submit a request and receive a empty object
                  cb(null, response.status < 300, response);
               } else {
                  cb(null, response.data, response);
               }
            });
         }

         return requestPromise;
      }

      /**
       * A function that receives the result of the API request.
       * @callback Requestable.callback
       * @param {Requestable.Error} error - the error returned by the API or `null`
       * @param {(Object|true)} result - the data returned by the API or `true` if the API returns `204 No Content`
       * @param {Object} request - the raw {@linkcode https://github.com/mzabriskie/axios#response-schema Response}
       */
      /**
       * Make a request.
       * @param {string} method - the method for the request (GET, PUT, POST, DELETE)
       * @param {string} path - the path for the request
       * @param {*} [data] - the data to send to the server. For HTTP methods that don't have a body the data
       *                   will be sent as query parameters
       * @param {Requestable.callback} [cb] - the callback for the request
       * @param {boolean} [raw=false] - if the request should be sent as raw. If this is a falsy value then the
       *                              request will be made as JSON
       * @return {Promise} - the Promise for the http request
       */

   }, {
      key: '_requestWithType',
      value: function _requestWithType(method, path, data, cb, responseType) {
         var url = this.__getURL(path);

         var AcceptHeader = (data || {}).AcceptHeader;
         if (AcceptHeader) {
            delete data.AcceptHeader;
         }
         var headers = this.__getRequestHeaders('json', AcceptHeader);

         var queryParams = {};

         var shouldUseDataAsParams = data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && methodHasNoBody(method);
         if (shouldUseDataAsParams) {
            queryParams = data;
            data = undefined;
         }

         var config = {
            url: url,
            method: method,
            headers: headers,
            params: queryParams,
            data: data,
            responseType: responseType === 'json' ? 'json' : responseType
         };

         log(config.method + ' to ' + config.url);
         var requestPromise = (0, _axios2.default)(config).catch(callbackErrorOrThrow(cb, path));

         if (cb) {
            requestPromise.then(function (response) {
               if (response.data && Object.keys(response.data).length > 0) {
                  // When data has results
                  cb(null, response.data, response);
               } else if (config.method !== 'GET' && Object.keys(response.data).length < 1) {
                  // True when successful submit a request and receive a empty object
                  cb(null, response.status < 300, response);
               } else {
                  cb(null, response.data, response);
               }
            });
         }

         return requestPromise;
      }

      /**
       * Make a request to an endpoint the returns 204 when true and 404 when false
       * @param {string} path - the path to request
       * @param {Object} data - any query parameters for the request
       * @param {Requestable.callback} cb - the callback that will receive `true` or `false`
       * @param {method} [method=GET] - HTTP Method to use
       * @return {Promise} - the promise for the http request
       */

   }, {
      key: '_request204or404',
      value: function _request204or404(path, data, cb) {
         var method = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'GET';

         return this._request(method, path, data).then(function success(response) {
            if (cb) {
               cb(null, true, response);
            }
            return true;
         }, function failure(response) {
            if (response.response.status === 404) {
               if (cb) {
                  cb(null, false, response);
               }
               return false;
            }

            if (cb) {
               cb(response);
            }
            throw response;
         });
      }

      /**
       * Make a request and fetch all the available data. Github will paginate responses so for queries
       * that might span multiple pages this method is preferred to {@link Requestable#request}
       * @param {string} path - the path to request
       * @param {Object} options - the query parameters to include
       * @param {Requestable.callback} [cb] - the function to receive the data. The returned data will always be an array.
       * @param {Object[]} results - the partial results. This argument is intended for internal use only.
       * @return {Promise} - a promise which will resolve when all pages have been fetched
       * @deprecated This will be folded into {@link Requestable#_request} in the 2.0 release.
       */

   }, {
      key: '_requestAllPages',
      value: function _requestAllPages(path, options, cb, results) {
         var _this2 = this;

         results = results || [];

         return this._request('GET', path, options).then(function (response) {
            var _results;

            var thisGroup = void 0;
            if (response.data instanceof Array) {
               thisGroup = response.data;
            } else if (response.data.items instanceof Array) {
               thisGroup = response.data.items;
            } else {
               var message = 'cannot figure out how to append ' + response.data + ' to the result set';
               throw new ResponseError(message, path, response);
            }
            (_results = results).push.apply(_results, _toConsumableArray(thisGroup));

            var nextUrl = getNextPage(response.headers.link);
            if (nextUrl) {
               if (!options) {
                  options = {};
               }
               options.page = parseInt(nextUrl.match(/([&\?]page=[0-9]*)/g).shift().split('=').pop());
               if (!(options && typeof options.page !== 'number')) {
                  log('getting next page: ' + nextUrl);
                  return _this2._requestAllPages(nextUrl, options, cb, results);
               }
            }

            if (cb) {
               cb(null, results, response);
            }

            response.data = results;
            return response;
         }).catch(callbackErrorOrThrow(cb, path));
      }
   }]);

   return Requestable;
}();

module.exports = Requestable;

// ////////////////////////// //
//  Private helper functions  //
// ////////////////////////// //
var METHODS_WITH_NO_BODY = ['GET', 'HEAD', 'DELETE'];
function methodHasNoBody(method) {
   return METHODS_WITH_NO_BODY.indexOf(method) !== -1;
}

function getNextPage() {
   var linksHeader = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

   var links = linksHeader.split(/\s*,\s*/); // splits and strips the urls
   return links.reduce(function (nextUrl, link) {
      if (link.search(/rel="next"/) !== -1) {
         return (link.match(/<(.*)>/) || [])[1];
      }

      return nextUrl;
   }, undefined);
}

function callbackErrorOrThrow(cb, path) {
   return function handler(object) {
      var error = void 0;
      if (object.hasOwnProperty('config')) {
         var _object$response = object.response,
             status = _object$response.status,
             statusText = _object$response.statusText,
             _object$config = object.config,
             method = _object$config.method,
             url = _object$config.url;

         var message = status + ' error making request ' + method + ' ' + url + ': "' + statusText + '"';
         error = new ResponseError(message, path, object);
         log(message + ' ' + JSON.stringify(object.data));
      } else {
         error = object;
      }
      if (cb) {
         log('going to error callback');
         cb(error);
      } else {
         log('throwing error');
         throw error;
      }
   };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlcXVlc3RhYmxlLmpzIl0sIm5hbWVzIjpbImxvZyIsIlJlc3BvbnNlRXJyb3IiLCJtZXNzYWdlIiwicGF0aCIsInJlc3BvbnNlIiwicmVxdWVzdCIsImNvbmZpZyIsInN0YXR1cyIsIkVycm9yIiwiUmVxdWVzdGFibGUiLCJhdXRoIiwiYXBpQmFzZSIsIkFjY2VwdEhlYWRlciIsIl9fYXBpQmFzZSIsIl9fYXV0aCIsInRva2VuIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIl9fQWNjZXB0SGVhZGVyIiwiX19hdXRob3JpemF0aW9uSGVhZGVyIiwiQmFzZTY0IiwiZW5jb2RlIiwidXJsIiwiaW5kZXhPZiIsIm5ld0NhY2hlQnVzdGVyIiwiRGF0ZSIsImdldFRpbWUiLCJyZXBsYWNlIiwicmF3IiwiaGVhZGVycyIsIkFjY2VwdCIsIkF1dGhvcml6YXRpb24iLCJyZXF1ZXN0T3B0aW9ucyIsInZpc2liaWxpdHkiLCJhZmZpbGlhdGlvbiIsInR5cGUiLCJzb3J0IiwicGVyX3BhZ2UiLCJkYXRlIiwidG9JU09TdHJpbmciLCJtZXRob2QiLCJkYXRhIiwiY2IiLCJfX2dldFVSTCIsIl9fZ2V0UmVxdWVzdEhlYWRlcnMiLCJxdWVyeVBhcmFtcyIsInNob3VsZFVzZURhdGFBc1BhcmFtcyIsIm1ldGhvZEhhc05vQm9keSIsInVuZGVmaW5lZCIsInBhcmFtcyIsInJlc3BvbnNlVHlwZSIsInJlcXVlc3RQcm9taXNlIiwiY2F0Y2giLCJjYWxsYmFja0Vycm9yT3JUaHJvdyIsInRoZW4iLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwiX3JlcXVlc3QiLCJzdWNjZXNzIiwiZmFpbHVyZSIsIm9wdGlvbnMiLCJyZXN1bHRzIiwidGhpc0dyb3VwIiwiQXJyYXkiLCJpdGVtcyIsInB1c2giLCJuZXh0VXJsIiwiZ2V0TmV4dFBhZ2UiLCJsaW5rIiwicGFnZSIsInBhcnNlSW50IiwibWF0Y2giLCJzaGlmdCIsInNwbGl0IiwicG9wIiwiX3JlcXVlc3RBbGxQYWdlcyIsIm1vZHVsZSIsImV4cG9ydHMiLCJNRVRIT0RTX1dJVEhfTk9fQk9EWSIsImxpbmtzSGVhZGVyIiwibGlua3MiLCJyZWR1Y2UiLCJzZWFyY2giLCJoYW5kbGVyIiwib2JqZWN0IiwiZXJyb3IiLCJoYXNPd25Qcm9wZXJ0eSIsInN0YXR1c1RleHQiLCJKU09OIiwic3RyaW5naWZ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFPQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7K2VBVEE7Ozs7Ozs7QUFXQSxJQUFNQSxNQUFNLHFCQUFNLGdCQUFOLENBQVo7O0FBRUE7Ozs7SUFHTUMsYTs7O0FBQ0g7Ozs7OztBQU1BLDBCQUFZQyxPQUFaLEVBQXFCQyxJQUFyQixFQUEyQkMsUUFBM0IsRUFBcUM7QUFBQTs7QUFBQSxnSUFDNUJGLE9BRDRCOztBQUVsQyxZQUFLQyxJQUFMLEdBQVlBLElBQVo7QUFDQSxZQUFLRSxPQUFMLEdBQWVELFNBQVNFLE1BQXhCO0FBQ0EsWUFBS0YsUUFBTCxHQUFnQixDQUFDQSxZQUFZLEVBQWIsRUFBaUJBLFFBQWpCLElBQTZCQSxRQUE3QztBQUNBLFlBQUtHLE1BQUwsR0FBY0gsU0FBU0csTUFBdkI7QUFMa0M7QUFNcEM7OztFQWJ3QkMsSzs7QUFnQjVCOzs7OztJQUdNQyxXO0FBQ0g7Ozs7Ozs7QUFPQTs7Ozs7OztBQU9BLHdCQUFZQyxJQUFaLEVBQWtCQyxPQUFsQixFQUEyQkMsWUFBM0IsRUFBeUM7QUFBQTs7QUFDdEMsV0FBS0MsU0FBTCxHQUFpQkYsV0FBVyx3QkFBNUI7QUFDQSxXQUFLRyxNQUFMLEdBQWM7QUFDWEMsZ0JBQU9MLEtBQUtLLEtBREQ7QUFFWEMsbUJBQVVOLEtBQUtNLFFBRko7QUFHWEMsbUJBQVVQLEtBQUtPO0FBSEosT0FBZDtBQUtBLFdBQUtDLGNBQUwsR0FBc0JOLGdCQUFnQixJQUF0Qzs7QUFFQSxVQUFJRixLQUFLSyxLQUFULEVBQWdCO0FBQ2IsY0FBS0kscUJBQUwsR0FBNkIsV0FBV1QsS0FBS0ssS0FBN0M7QUFDRixPQUZELE1BRU8sSUFBSUwsS0FBS00sUUFB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aUMsTUFBN0MsU0FBdURsQixHQUF2RCxXQUFnRWtFLFVBQWhFLE1BQUo7QUFDQUYsaUJBQVEsSUFBSXJGLGFBQUosQ0FBa0JDLE9BQWxCLEVBQTJCQyxJQUEzQixFQUFpQ2tGLE1BQWpDLENBQVI7QUFDQXJGLGFBQU9FLE9BQVAsU0FBa0J1RixLQUFLQyxTQUFMLENBQWVMLE9BQU81QyxJQUF0QixDQUFsQjtBQUNGLE9BTEQsTUFLTztBQUNKNkMsaUJBQVFELE1BQVI7QUFDRjtBQUNELFVBQUkzQyxFQUFKLEVBQVE7QUFDTDFDLGFBQUkseUJBQUo7QUFDQTBDLFlBQUc0QyxLQUFIO0FBQ0YsT0FIRCxNQUdPO0FBQ0p0RixhQUFJLGdCQUFKO0FBQ0EsZUFBTXNGLEtBQU47QUFDRjtBQUNILElBakJEO0FBa0JGIiwiZmlsZSI6IlJlcXVlc3RhYmxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZVxuICogQGNvcHlyaWdodCAgMjAxNiBZYWhvbyBJbmMuXG4gKiBAbGljZW5zZSAgICBMaWNlbnNlZCB1bmRlciB7QGxpbmsgaHR0cHM6Ly9zcGR4Lm9yZy9saWNlbnNlcy9CU0QtMy1DbGF1c2UtQ2xlYXIuaHRtbCBCU0QtMy1DbGF1c2UtQ2xlYXJ9LlxuICogICAgICAgICAgICAgR2l0aHViLmpzIGlzIGZyZWVseSBkaXN0cmlidXRhYmxlLlxuICovXG5cbmltcG9ydCBheGlvcyBmcm9tICdheGlvcyc7XG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuaW1wb3J0IHtCYXNlNjR9IGZyb20gJ2pzLWJhc2U2NCc7XG5cbmNvbnN0IGxvZyA9IGRlYnVnKCdnaXRodWI6cmVxdWVzdCcpO1xuXG4vKipcbiAqIFRoZSBlcnJvciBzdHJ1Y3R1cmUgcmV0dXJuZWQgd2hlbiBhIG5ldHdvcmsgY2FsbCBmYWlsc1xuICovXG5jbGFzcyBSZXNwb25zZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgLyoqXG4gICAgKiBDb25zdHJ1Y3QgYSBuZXcgUmVzcG9uc2VFcnJvclxuICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBhbiBtZXNzYWdlIHRvIHJldHVybiBpbnN0ZWFkIG9mIHRoZSB0aGUgZGVmYXVsdCBlcnJvciBtZXNzYWdlXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSByZXF1ZXN0ZWQgcGF0aFxuICAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIC0gdGhlIG9iamVjdCByZXR1cm5lZCBieSBBeGlvc1xuICAgICovXG4gICBjb25zdHJ1Y3RvcihtZXNzYWdlLCBwYXRoLCByZXNwb25zZSkge1xuICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgICAgdGhpcy5yZXF1ZXN0ID0gcmVzcG9uc2UuY29uZmlnO1xuICAgICAgdGhpcy5yZXNwb25zZSA9IChyZXNwb25zZSB8fCB7fSkucmVzcG9uc2UgfHwgcmVzcG9uc2U7XG4gICAgICB0aGlzLnN0YXR1cyA9IHJlc3BvbnNlLnN0YXR1cztcbiAgIH1cbn1cblxuLyoqXG4gKiBSZXF1ZXN0YWJsZSB3cmFwcyB0aGUgbG9naWMgZm9yIG1ha2luZyBodHRwIHJlcXVlc3RzIHRvIHRoZSBBUElcbiAqL1xuY2xhc3MgUmVxdWVzdGFibGUge1xuICAgLyoqXG4gICAgKiBFaXRoZXIgYSB1c2VybmFtZSBhbmQgcGFzc3dvcmQgb3IgYW4gb2F1dGggdG9rZW4gZm9yIEdpdGh1YlxuICAgICogQHR5cGVkZWYge09iamVjdH0gUmVxdWVzdGFibGUuYXV0aFxuICAgICogQHByb3Age3N0cmluZ30gW3VzZXJuYW1lXSAtIHRoZSBHaXRodWIgdXNlcm5hbWVcbiAgICAqIEBwcm9wIHtzdHJpbmd9IFtwYXNzd29yZF0gLSB0aGUgdXNlcidzIHBhc3N3b3JkXG4gICAgKiBAcHJvcCB7dG9rZW59IFt0b2tlbl0gLSBhbiBPQXV0aCB0b2tlblxuICAgICovXG4gICAvKipcbiAgICAqIEluaXRpYWxpemUgdGhlIGh0dHAgaW50ZXJuYWxzLlxuICAgICogQHBhcmFtIHtSZXF1ZXN0YWJsZS5hdXRofSBbYXV0aF0gLSB0aGUgY3JlZGVudGlhbHMgdG8gYXV0aGVudGljYXRlIHRvIEdpdGh1Yi4gSWYgYXV0aCBpc1xuICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90IHByb3ZpZGVkIHJlcXVlc3Qgd2lsbCBiZSBtYWRlIHVuYXV0aGVudGljYXRlZFxuICAgICogQHBhcmFtIHtzdHJpbmd9IFthcGlCYXNlPWh0dHBzOi8vYXBpLmdpdGh1Yi5jb21dIC0gdGhlIGJhc2UgR2l0aHViIEFQSSBVUkxcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBbQWNjZXB0SGVhZGVyPXYzXSAtIHRoZSBhY2NlcHQgaGVhZGVyIGZvciB0aGUgcmVxdWVzdHNcbiAgICAqL1xuICAgY29uc3RydWN0b3IoYXV0aCwgYXBpQmFzZSwgQWNjZXB0SGVhZGVyKSB7XG4gICAgICB0aGlzLl9fYXBpQmFzZSA9IGFwaUJhc2UgfHwgJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20nO1xuICAgICAgdGhpcy5fX2F1dGggPSB7XG4gICAgICAgICB0b2tlbjogYXV0aC50b2tlbixcbiAgICAgICAgIHVzZXJuYW1lOiBhdXRoLnVzZXJuYW1lLFxuICAgICAgICAgcGFzc3dvcmQ6IGF1dGgucGFzc3dvcmQsXG4gICAgICB9O1xuICAgICAgdGhpcy5fX0FjY2VwdEhlYWRlciA9IEFjY2VwdEhlYWRlciB8fCAndjMnO1xuXG4gICAgICBpZiAoYXV0aC50b2tlbikge1xuICAgICAgICAgdGhpcy5fX2F1dGhvcml6YXRpb25IZWFkZXIgPSAndG9rZW4gJyArIGF1dGgudG9rZW47XG4gICAgICB9IGVsc2UgaWYgKGF1dGgudXNlcm5hbWUgJiYgYXV0aC5wYXNzd29yZCkge1xuICAgICAgICAgdGhpcy5fX2F1dGhvcml6YXRpb25IZWFkZXIgPSAnQmFzaWMgJyArIEJhc2U2NC5lbmNvZGUoYXV0aC51c2VybmFtZSArICc6JyArIGF1dGgucGFzc3dvcmQpO1xuICAgICAgfVxuICAgfVxuXG4gICAvKipcbiAgICAqIENvbXB1dGUgdGhlIFVSTCB0byB1c2UgdG8gbWFrZSBhIHJlcXVlc3QuXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBlaXRoZXIgYSBVUkwgcmVsYXRpdmUgdG8gdGhlIEFQSSBiYXNlIG9yIGFuIGFic29sdXRlIFVSTFxuICAgICogQHJldHVybiB7c3RyaW5nfSAtIHRoZSBVUkwgdG8gdXNlXG4gICAgKi9cbiAgIF9fZ2V0VVJMKHBhdGgpIHtcbiAgICAgIGxldCB1cmwgPSBwYXRoO1xuXG4gICAgICBpZiAocGF0aC5pbmRleE9mKCcvLycpID09PSAtMSkge1xuICAgICAgICAgdXJsID0gdGhpcy5fX2FwaUJhc2UgKyBwYXRoO1xuICAgICAgfVxuXG4gICAgICBsZXQgbmV3Q2FjaGVCdXN0ZXIgPSAndGltZXN0YW1wPScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIHJldHVybiB1cmwucmVwbGFjZSgvKHRpbWVzdGFtcD1cXGQrKS8sIG5ld0NhY2hlQnVzdGVyKTtcbiAgIH1cblxuICAgLyoqXG4gICAgKiBDb21wdXRlIHRoZSBoZWFkZXJzIHJlcXVpcmVkIGZvciBhbiBBUEkgcmVxdWVzdC5cbiAgICAqIEBwcml2YXRlXG4gICAgKiBAcGFyYW0ge2Jvb2xlYW59IHJhdyAtIGlmIHRoZSByZXF1ZXN0IHNob3VsZCBiZSB0cmVhdGVkIGFzIEpTT04gb3IgYXMgYSByYXcgcmVxdWVzdFxuICAgICogQHBhcmFtIHtzdHJpbmd9IEFjY2VwdEhlYWRlciAtIHRoZSBhY2NlcHQgaGVhZGVyIGZvciB0aGUgcmVxdWVzdFxuICAgICogQHJldHVybiB7T2JqZWN0fSAtIHRoZSBoZWFkZXJzIHRvIHVzZSBpbiB0aGUgcmVxdWVzdFxuICAgICovXG4gICBfX2dldFJlcXVlc3RIZWFkZXJzKHJhdywgQWNjZXB0SGVhZGVyKSB7XG4gICAgICBsZXQgaGVhZGVycyA9IHtcbiAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PVVURi04JyxcbiAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vdm5kLmdpdGh1Yi4nICsgKEFjY2VwdEhlYWRlciB8fCB0aGlzLl9fQWNjZXB0SGVhZGVyKSxcbiAgICAgIH07XG5cbiAgICAgIGlmIChyYXcpIHtcbiAgICAgICAgIGhlYWRlcnMuQWNjZXB0ICs9ICcucmF3JztcbiAgICAgIH1cbiAgICAgIGhlYWRlcnMuQWNjZXB0ICs9ICcranNvbic7XG5cbiAgICAgIGlmICh0aGlzLl9fYXV0aG9yaXphdGlvbkhlYWRlcikge1xuICAgICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gdGhpcy5fX2F1dGhvcml6YXRpb25IZWFkZXI7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgfVxuXG4gICAvKipcbiAgICAqIFNldHMgdGhlIGRlZmF1bHQgb3B0aW9ucyBmb3IgQVBJIHJlcXVlc3RzXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgKiBAcGFyYW0ge09iamVjdH0gW3JlcXVlc3RPcHRpb25zPXt9XSAtIHRoZSBjdXJyZW50IG9wdGlvbnMgZm9yIHRoZSByZXF1ZXN0XG4gICAgKiBAcmV0dXJuIHtPYmplY3R9IC0gdGhlIG9wdGlvbnMgdG8gcGFzcyB0byB0aGUgcmVxdWVzdFxuICAgICovXG4gICBfZ2V0T3B0aW9uc1dpdGhEZWZhdWx0cyhyZXF1ZXN0T3B0aW9ucyA9IHt9KSB7XG4gICAgICBpZiAoIShyZXF1ZXN0T3B0aW9ucy52aXNpYmlsaXR5IHx8IHJlcXVlc3RPcHRpb25zLmFmZmlsaWF0aW9uKSkge1xuICAgICAgICAgcmVxdWVzdE9wdGlvbnMudHlwZSA9IHJlcXVlc3RPcHRpb25zLnR5cGUgfHwgJ2FsbCc7XG4gICAgICB9XG4gICAgICByZXF1ZXN0T3B0aW9ucy5zb3J0ID0gcmVxdWVzdE9wdGlvbnMuc29ydCB8fCAndXBkYXRlZCc7XG4gICAgICByZXF1ZXN0T3B0aW9ucy5wZXJfcGFnZSA9IHJlcXVlc3RPcHRpb25zLnBlcl9wYWdlIHx8ICcxMDAnOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cbiAgICAgIHJldHVybiByZXF1ZXN0T3B0aW9ucztcbiAgIH1cblxuICAgLyoqXG4gICAgKiBpZiBhIGBEYXRlYCBpcyBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiBpdCB3aWxsIGJlIGNvbnZlcnRlZCB0byBhbiBJU08gc3RyaW5nXG4gICAgKiBAcGFyYW0geyp9IGRhdGUgLSB0aGUgb2JqZWN0IHRvIGF0dGVtcHQgdG8gY29lcmNlIGludG8gYW4gSVNPIGRhdGUgc3RyaW5nXG4gICAgKiBAcmV0dXJuIHtzdHJpbmd9IC0gdGhlIElTTyByZXByZXNlbnRhdGlvbiBvZiBgZGF0ZWAgb3Igd2hhdGV2ZXIgd2FzIHBhc3NlZCBpbiBpZiBpdCB3YXMgbm90IGEgZGF0ZVxuICAgICovXG4gICBfZGF0ZVRvSVNPKGRhdGUpIHtcbiAgICAgIGlmIChkYXRlICYmIChkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgICAgIGRhdGUgPSBkYXRlLnRvSVNPU3RyaW5nKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkYXRlO1xuICAgfVxuXG4gICAvKipcbiAgICAqIEEgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyB0aGUgcmVzdWx0IG9mIHRoZSBBUEkgcmVxdWVzdC5cbiAgICAqIEBjYWxsYmFjayBSZXF1ZXN0YWJsZS5jYWxsYmFja1xuICAgICogQHBhcmFtIHtSZXF1ZXN0YWJsZS5FcnJvcn0gZXJyb3IgLSB0aGUgZXJyb3IgcmV0dXJuZWQgYnkgdGhlIEFQSSBvciBgbnVsbGBcbiAgICAqIEBwYXJhbSB7KE9iamVjdHx0cnVlKX0gcmVzdWx0IC0gdGhlIGRhdGEgcmV0dXJuZWQgYnkgdGhlIEFQSSBvciBgdHJ1ZWAgaWYgdGhlIEFQSSByZXR1cm5zIGAyMDQgTm8gQ29udGVudGBcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXF1ZXN0IC0gdGhlIHJhdyB7QGxpbmtjb2RlIGh0dHBzOi8vZ2l0aHViLmNvbS9temFicmlza2llL2F4aW9zI3Jlc3BvbnNlLXNjaGVtYSBSZXNwb25zZX1cbiAgICAqL1xuICAgLyoqXG4gICAgKiBNYWtlIGEgcmVxdWVzdC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSB0aGUgbWV0aG9kIGZvciB0aGUgcmVxdWVzdCAoR0VULCBQVVQsIFBPU1QsIERFTEVURSlcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gdGhlIHBhdGggZm9yIHRoZSByZXF1ZXN0XG4gICAgKiBAcGFyYW0geyp9IFtkYXRhXSAtIHRoZSBkYXRhIHRvIHNlbmQgdG8gdGhlIHNlcnZlci4gRm9yIEhUVFAgbWV0aG9kcyB0aGF0IGRvbid0IGhhdmUgYSBib2R5IHRoZSBkYXRhXG4gICAgKiAgICAgICAgICAgICAgICAgICB3aWxsIGJlIHNlbnQgYXMgcXVlcnkgcGFyYW1ldGVyc1xuICAgICogQHBhcmFtIHtSZXF1ZXN0YWJsZS5jYWxsYmFja30gW2NiXSAtIHRoZSBjYWxsYmFjayBmb3IgdGhlIHJlcXVlc3RcbiAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Jhdz1mYWxzZV0gLSBpZiB0aGUgcmVxdWVzdCBzaG91bGQgYmUgc2VudCBhcyByYXcuIElmIHRoaXMgaXMgYSBmYWxzeSB2YWx1ZSB0aGVuIHRoZVxuICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0IHdpbGwgYmUgbWFkZSBhcyBKU09OXG4gICAgKiBAcmV0dXJuIHtQcm9taXNlfSAtIHRoZSBQcm9taXNlIGZvciB0aGUgaHR0cCByZXF1ZXN0XG4gICAgKi9cbiAgIF9yZXF1ZXN0KG1ldGhvZCwgcGF0aCwgZGF0YSwgY2IsIHJhdykge1xuICAgICAgY29uc3QgdXJsID0gdGhpcy5fX2dldFVSTChwYXRoKTtcblxuICAgICAgY29uc3QgQWNjZXB0SGVhZGVyID0gKGRhdGEgfHwge30pLkFjY2VwdEhlYWRlcjtcbiAgICAgIGlmIChBY2NlcHRIZWFkZXIpIHtcbiAgICAgICAgIGRlbGV0ZSBkYXRhLkFjY2VwdEhlYWRlcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGhlYWRlcnMgPSB0aGlzLl9fZ2V0UmVxdWVzdEhlYWRlcnMocmF3LCBBY2NlcHRIZWFkZXIpO1xuXG4gICAgICBsZXQgcXVlcnlQYXJhbXMgPSB7fTtcblxuICAgICAgY29uc3Qgc2hvdWxkVXNlRGF0YUFzUGFyYW1zID0gZGF0YSAmJiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnKSAmJiBtZXRob2RIYXNOb0JvZHkobWV0aG9kKTtcbiAgICAgIGlmIChzaG91bGRVc2VEYXRhQXNQYXJhbXMpIHtcbiAgICAgICAgIHF1ZXJ5UGFyYW1zID0gZGF0YTtcbiAgICAgICAgIGRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbmZpZyA9IHtcbiAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcyxcbiAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICByZXNwb25zZVR5cGU6IHJhdyA/ICd0ZXh0JyA6ICdqc29uJyxcbiAgICAgIH07XG5cbiAgICAgIGxvZyhgJHtjb25maWcubWV0aG9kfSB0byAke2NvbmZpZy51cmx9YCk7XG4gICAgICBjb25zdCByZXF1ZXN0UHJvbWlzZSA9IGF4aW9zKGNvbmZpZykuY2F0Y2goY2FsbGJhY2tFcnJvck9yVGhyb3coY2IsIHBhdGgpKTtcblxuICAgICAgaWYgKGNiKSB7XG4gICAgICAgICByZXF1ZXN0UHJvbWlzZS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEgJiYgT2JqZWN0LmtleXMocmVzcG9uc2UuZGF0YSkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgLy8gV2hlbiBkYXRhIGhhcyByZXN1bHRzXG4gICAgICAgICAgICAgICBjYihudWxsLCByZXNwb25zZS5kYXRhLCByZXNwb25zZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbmZpZy5tZXRob2QgIT09ICdHRVQnICYmIE9iamVjdC5rZXlzKHJlc3BvbnNlLmRhdGEpLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgIC8vIFRydWUgd2hlbiBzdWNjZXNzZnVsIHN1Ym1pdCBhIHJlcXVlc3QgYW5kIHJlY2VpdmUgYSBlbXB0eSBvYmplY3RcbiAgICAgICAgICAgICAgIGNiKG51bGwsIChyZXNwb25zZS5zdGF0dXMgPCAzMDApLCByZXNwb25zZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgY2IobnVsbCwgcmVzcG9uc2UuZGF0YSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXF1ZXN0UHJvbWlzZTtcbiAgIH1cblxuICAgLyoqXG4gICAgKiBBIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIHJlc3VsdCBvZiB0aGUgQVBJIHJlcXVlc3QuXG4gICAgKiBAY2FsbGJhY2sgUmVxdWVzdGFibGUuY2FsbGJhY2tcbiAgICAqIEBwYXJhbSB7UmVxdWVzdGFibGUuRXJyb3J9IGVycm9yIC0gdGhlIGVycm9yIHJldHVybmVkIGJ5IHRoZSBBUEkgb3IgYG51bGxgXG4gICAgKiBAcGFyYW0geyhPYmplY3R8dHJ1ZSl9IHJlc3VsdCAtIHRoZSBkYXRhIHJldHVybmVkIGJ5IHRoZSBBUEkgb3IgYHRydWVgIGlmIHRoZSBBUEkgcmV0dXJucyBgMjA0IE5vIENvbnRlbnRgXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcmVxdWVzdCAtIHRoZSByYXcge0BsaW5rY29kZSBodHRwczovL2dpdGh1Yi5jb20vbXphYnJpc2tpZS9heGlvcyNyZXNwb25zZS1zY2hlbWEgUmVzcG9uc2V9XG4gICAgKi9cbiAgIC8qKlxuICAgICogTWFrZSBhIHJlcXVlc3QuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kIC0gdGhlIG1ldGhvZCBmb3IgdGhlIHJlcXVlc3QgKEdFVCwgUFVULCBQT1NULCBERUxFVEUpXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSBwYXRoIGZvciB0aGUgcmVxdWVzdFxuICAgICogQHBhcmFtIHsqfSBbZGF0YV0gLSB0aGUgZGF0YSB0byBzZW5kIHRvIHRoZSBzZXJ2ZXIuIEZvciBIVFRQIG1ldGhvZHMgdGhhdCBkb24ndCBoYXZlIGEgYm9keSB0aGUgZGF0YVxuICAgICogICAgICAgICAgICAgICAgICAgd2lsbCBiZSBzZW50IGFzIHF1ZXJ5IHBhcmFtZXRlcnNcbiAgICAqIEBwYXJhbSB7UmVxdWVzdGFibGUuY2FsbGJhY2t9IFtjYl0gLSB0aGUgY2FsbGJhY2sgZm9yIHRoZSByZXF1ZXN0XG4gICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyYXc9ZmFsc2VdIC0gaWYgdGhlIHJlcXVlc3Qgc2hvdWxkIGJlIHNlbnQgYXMgcmF3LiBJZiB0aGlzIGlzIGEgZmFsc3kgdmFsdWUgdGhlbiB0aGVcbiAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdCB3aWxsIGJlIG1hZGUgYXMgSlNPTlxuICAgICogQHJldHVybiB7UHJvbWlzZX0gLSB0aGUgUHJvbWlzZSBmb3IgdGhlIGh0dHAgcmVxdWVzdFxuICAgICovXG4gICBfcmVxdWVzdFdpdGhUeXBlKG1ldGhvZCwgcGF0aCwgZGF0YSwgY2IsIHJlc3BvbnNlVHlwZSkge1xuICAgICAgY29uc3QgdXJsID0gdGhpcy5fX2dldFVSTChwYXRoKTtcblxuICAgICAgY29uc3QgQWNjZXB0SGVhZGVyID0gKGRhdGEgfHwge30pLkFjY2VwdEhlYWRlcjtcbiAgICAgIGlmIChBY2NlcHRIZWFkZXIpIHtcbiAgICAgICAgIGRlbGV0ZSBkYXRhLkFjY2VwdEhlYWRlcjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGhlYWRlcnMgPSB0aGlzLl9fZ2V0UmVxdWVzdEhlYWRlcnMoJ2pzb24nICwgQWNjZXB0SGVhZGVyKTtcblxuICAgICAgbGV0IHF1ZXJ5UGFyYW1zID0ge307XG5cbiAgICAgIGNvbnN0IHNob3VsZFVzZURhdGFBc1BhcmFtcyA9IGRhdGEgJiYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0JykgJiYgbWV0aG9kSGFzTm9Cb2R5KG1ldGhvZCk7XG4gICAgICBpZiAoc2hvdWxkVXNlRGF0YUFzUGFyYW1zKSB7XG4gICAgICAgICBxdWVyeVBhcmFtcyA9IGRhdGE7XG4gICAgICAgICBkYXRhID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb25maWcgPSB7XG4gICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgIHBhcmFtczogcXVlcnlQYXJhbXMsXG4gICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgcmVzcG9uc2VUeXBlOiByZXNwb25zZVR5cGUgPT09ICdqc29uJyA/ICdqc29uJyA6IHJlc3BvbnNlVHlwZSxcbiAgICAgIH07XG5cbiAgICAgIGxvZyhgJHtjb25maWcubWV0aG9kfSB0byAke2NvbmZpZy51cmx9YCk7XG4gICAgICBjb25zdCByZXF1ZXN0UHJvbWlzZSA9IGF4aW9zKGNvbmZpZykuY2F0Y2goY2FsbGJhY2tFcnJvck9yVGhyb3coY2IsIHBhdGgpKTtcblxuICAgICAgaWYgKGNiKSB7XG4gICAgICAgICByZXF1ZXN0UHJvbWlzZS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEgJiYgT2JqZWN0LmtleXMocmVzcG9uc2UuZGF0YSkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgLy8gV2hlbiBkYXRhIGhhcyByZXN1bHRzXG4gICAgICAgICAgICAgICBjYihudWxsLCByZXNwb25zZS5kYXRhLCByZXNwb25zZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbmZpZy5tZXRob2QgIT09ICdHRVQnICYmIE9iamVjdC5rZXlzKHJlc3BvbnNlLmRhdGEpLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgIC8vIFRydWUgd2hlbiBzdWNjZXNzZnVsIHN1Ym1pdCBhIHJlcXVlc3QgYW5kIHJlY2VpdmUgYSBlbXB0eSBvYmplY3RcbiAgICAgICAgICAgICAgIGNiKG51bGwsIChyZXNwb25zZS5zdGF0dXMgPCAzMDApLCByZXNwb25zZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgY2IobnVsbCwgcmVzcG9uc2UuZGF0YSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXF1ZXN0UHJvbWlzZTtcbiAgIH1cblxuICAgLyoqXG4gICAgKiBNYWtlIGEgcmVxdWVzdCB0byBhbiBlbmRwb2ludCB0aGUgcmV0dXJucyAyMDQgd2hlbiB0cnVlIGFuZCA0MDQgd2hlbiBmYWxzZVxuICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSB0aGUgcGF0aCB0byByZXF1ZXN0XG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIGFueSBxdWVyeSBwYXJhbWV0ZXJzIGZvciB0aGUgcmVxdWVzdFxuICAgICogQHBhcmFtIHtSZXF1ZXN0YWJsZS5jYWxsYmFja30gY2IgLSB0aGUgY2FsbGJhY2sgdGhhdCB3aWxsIHJlY2VpdmUgYHRydWVgIG9yIGBmYWxzZWBcbiAgICAqIEBwYXJhbSB7bWV0aG9kfSBbbWV0aG9kPUdFVF0gLSBIVFRQIE1ldGhvZCB0byB1c2VcbiAgICAqIEByZXR1cm4ge1Byb21pc2V9IC0gdGhlIHByb21pc2UgZm9yIHRoZSBodHRwIHJlcXVlc3RcbiAgICAqL1xuICAgX3JlcXVlc3QyMDRvcjQwNChwYXRoLCBkYXRhLCBjYiwgbWV0aG9kID0gJ0dFVCcpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZXF1ZXN0KG1ldGhvZCwgcGF0aCwgZGF0YSlcbiAgICAgICAgIC50aGVuKGZ1bmN0aW9uIHN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgY2IobnVsbCwgdHJ1ZSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICB9LCBmdW5jdGlvbiBmYWlsdXJlKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UucmVzcG9uc2Uuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICAgICAgY2IobnVsbCwgZmFsc2UsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICBjYihyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyByZXNwb25zZTtcbiAgICAgICAgIH0pO1xuICAgfVxuXG4gICAvKipcbiAgICAqIE1ha2UgYSByZXF1ZXN0IGFuZCBmZXRjaCBhbGwgdGhlIGF2YWlsYWJsZSBkYXRhLiBHaXRodWIgd2lsbCBwYWdpbmF0ZSByZXNwb25zZXMgc28gZm9yIHF1ZXJpZXNcbiAgICAqIHRoYXQgbWlnaHQgc3BhbiBtdWx0aXBsZSBwYWdlcyB0aGlzIG1ldGhvZCBpcyBwcmVmZXJyZWQgdG8ge0BsaW5rIFJlcXVlc3RhYmxlI3JlcXVlc3R9XG4gICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSBwYXRoIHRvIHJlcXVlc3RcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gdGhlIHF1ZXJ5IHBhcmFtZXRlcnMgdG8gaW5jbHVkZVxuICAgICogQHBhcmFtIHtSZXF1ZXN0YWJsZS5jYWxsYmFja30gW2NiXSAtIHRoZSBmdW5jdGlvbiB0byByZWNlaXZlIHRoZSBkYXRhLiBUaGUgcmV0dXJuZWQgZGF0YSB3aWxsIGFsd2F5cyBiZSBhbiBhcnJheS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0W119IHJlc3VsdHMgLSB0aGUgcGFydGlhbCByZXN1bHRzLiBUaGlzIGFyZ3VtZW50IGlzIGludGVuZGVkIGZvciBpbnRlcm5hbCB1c2Ugb25seS5cbiAgICAqIEByZXR1cm4ge1Byb21pc2V9IC0gYSBwcm9taXNlIHdoaWNoIHdpbGwgcmVzb2x2ZSB3aGVuIGFsbCBwYWdlcyBoYXZlIGJlZW4gZmV0Y2hlZFxuICAgICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIGZvbGRlZCBpbnRvIHtAbGluayBSZXF1ZXN0YWJsZSNfcmVxdWVzdH0gaW4gdGhlIDIuMCByZWxlYXNlLlxuICAgICovXG4gICBfcmVxdWVzdEFsbFBhZ2VzKHBhdGgsIG9wdGlvbnMsIGNiLCByZXN1bHRzKSB7XG4gICAgICByZXN1bHRzID0gcmVzdWx0cyB8fCBbXTtcblxuICAgICAgcmV0dXJuIHRoaXMuX3JlcXVlc3QoJ0dFVCcsIHBhdGgsIG9wdGlvbnMpXG4gICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGxldCB0aGlzR3JvdXA7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICB0aGlzR3JvdXAgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5kYXRhLml0ZW1zIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgIHRoaXNHcm91cCA9IHJlc3BvbnNlLmRhdGEuaXRlbXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBgY2Fubm90IGZpZ3VyZSBvdXQgaG93IHRvIGFwcGVuZCAke3Jlc3BvbnNlLmRhdGF9IHRvIHRoZSByZXN1bHQgc2V0YDtcbiAgICAgICAgICAgICAgIHRocm93IG5ldyBSZXNwb25zZUVycm9yKG1lc3NhZ2UsIHBhdGgsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCguLi50aGlzR3JvdXApO1xuXG4gICAgICAgICAgICBjb25zdCBuZXh0VXJsID0gZ2V0TmV4dFBhZ2UocmVzcG9uc2UuaGVhZGVycy5saW5rKTtcbiAgICAgICAgICAgIGlmKG5leHRVcmwpIHtcbiAgICAgICAgICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgb3B0aW9ucy5wYWdlID0gcGFyc2VJbnQoXG4gICAgICAgICAgICAgICAgIG5leHRVcmwubWF0Y2goLyhbJlxcP11wYWdlPVswLTldKikvZylcbiAgICAgICAgICAgICAgICAgICAuc2hpZnQoKVxuICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnPScpXG4gICAgICAgICAgICAgICAgICAgLnBvcCgpXG4gICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgaWYgKCEob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5wYWdlICE9PSAnbnVtYmVyJykpIHtcbiAgICAgICAgICAgICAgICAgIGxvZyhgZ2V0dGluZyBuZXh0IHBhZ2U6ICR7bmV4dFVybH1gKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZXF1ZXN0QWxsUGFnZXMobmV4dFVybCwgb3B0aW9ucywgY2IsIHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgIGNiKG51bGwsIHJlc3VsdHMsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IHJlc3VsdHM7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICB9KS5jYXRjaChjYWxsYmFja0Vycm9yT3JUaHJvdyhjYiwgcGF0aCkpO1xuICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcXVlc3RhYmxlO1xuXG4vLyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyAvL1xuLy8gIFByaXZhdGUgaGVscGVyIGZ1bmN0aW9ucyAgLy9cbi8vIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vIC8vXG5jb25zdCBNRVRIT0RTX1dJVEhfTk9fQk9EWSA9IFsnR0VUJywgJ0hFQUQnLCAnREVMRVRFJ107XG5mdW5jdGlvbiBtZXRob2RIYXNOb0JvZHkobWV0aG9kKSB7XG4gICByZXR1cm4gTUVUSE9EU19XSVRIX05PX0JPRFkuaW5kZXhPZihtZXRob2QpICE9PSAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0TmV4dFBhZ2UobGlua3NIZWFkZXIgPSAnJykge1xuICAgY29uc3QgbGlua3MgPSBsaW5rc0hlYWRlci5zcGxpdCgvXFxzKixcXHMqLyk7IC8vIHNwbGl0cyBhbmQgc3RyaXBzIHRoZSB1cmxzXG4gICByZXR1cm4gbGlua3MucmVkdWNlKGZ1bmN0aW9uKG5leHRVcmwsIGxpbmspIHtcbiAgICAgIGlmIChsaW5rLnNlYXJjaCgvcmVsPVwibmV4dFwiLykgIT09IC0xKSB7XG4gICAgICAgICByZXR1cm4gKGxpbmsubWF0Y2goLzwoLiopPi8pIHx8IFtdKVsxXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5leHRVcmw7XG4gICB9LCB1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBjYWxsYmFja0Vycm9yT3JUaHJvdyhjYiwgcGF0aCkge1xuICAgcmV0dXJuIGZ1bmN0aW9uIGhhbmRsZXIob2JqZWN0KSB7XG4gICAgICBsZXQgZXJyb3I7XG4gICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KCdjb25maWcnKSkge1xuICAgICAgICAgY29uc3Qge3Jlc3BvbnNlOiB7c3RhdHVzLCBzdGF0dXNUZXh0fSwgY29uZmlnOiB7bWV0aG9kLCB1cmx9fSA9IG9iamVjdDtcbiAgICAgICAgIGxldCBtZXNzYWdlID0gKGAke3N0YXR1c30gZXJyb3IgbWFraW5nIHJlcXVlc3QgJHttZXRob2R9ICR7dXJsfTogXCIke3N0YXR1c1RleHR9XCJgKTtcbiAgICAgICAgIGVycm9yID0gbmV3IFJlc3BvbnNlRXJyb3IobWVzc2FnZSwgcGF0aCwgb2JqZWN0KTtcbiAgICAgICAgIGxvZyhgJHttZXNzYWdlfSAke0pTT04uc3RyaW5naWZ5KG9iamVjdC5kYXRhKX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICBlcnJvciA9IG9iamVjdDtcbiAgICAgIH1cbiAgICAgIGlmIChjYikge1xuICAgICAgICAgbG9nKCdnb2luZyB0byBlcnJvciBjYWxsYmFjaycpO1xuICAgICAgICAgY2IoZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgIGxvZygndGhyb3dpbmcgZXJyb3InKTtcbiAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgfTtcbn1cbiJdfQ==
//# sourceMappingURL=Requestable.js.map
