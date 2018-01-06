var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * 高级fetch组件
 * @author esky
 * 
 * type错误类型：status响应状态异常  err通用错误 timeout超时 abort请求被忽略
 * {
 * 	type: 'err',
 * 	msg: '',
 * 	error
 * }
 */
import BaseFetch from './BaseFetch';
var defaultConfig = {
	// 成功处理函数
	// 处理拦截器，函数数组，可定义请求响应且默认处理完毕之后的promise
	// function(rs){}
	resoleHandler: null,
	// 拒绝处理函数
	// function(err){}
	rejectHandler: null,
	// 超时毫秒数
	timeout: 10 * 60 * 1000,
	timeoutMsg: '请求超时',
	abortMsg: '请求被忽略',
	// 是否可忽略
	canAbort: true
};

var SuperFetch = function (_BaseFetch) {
	_inherits(SuperFetch, _BaseFetch);

	function SuperFetch(conf) {
		_classCallCheck(this, SuperFetch);

		var _this = _possibleConstructorReturn(this, _BaseFetch.call(this, conf));

		_this.config = Object.assign({}, defaultConfig, _this.config);
		_this.timeoutId = null;
		_this.isAbort = false;
		return _this;
	}
	/**
  * 发送请求
  */


	SuperFetch.prototype.fetch = function fetch(url) {
		var _this2 = this;

		var fetchConf = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		var baseFetchPromise = _BaseFetch.prototype.fetch.call(this, url, fetchConf);

		this.fetchPromise = Promise.race([baseFetchPromise,
		// 忽略检测
		new Promise(function (resolve, reject) {
			if (_this2.config.canAbort) {
				_this2.intervalId = setInterval(function () {
					if (_this2.isAbort) {
						reject({
							type: 'abort',
							msg: _this2.config.abortMsg,
							error: new Error(_this2.config.abortMsg)
						});
					}
				}, 300);
			}
		}),
		// 超时处理
		new Promise(function (resolve, reject) {
			_this2.timeoutId = setTimeout(function () {
				return reject({
					type: 'timeout',
					msg: _this2.config.timeoutMsg,
					error: new Error(_this2.config.timeoutMsg)
				});
			}, _this2.config.timeout);
		})]);
		return this.fetchPromise.then(function (rs) {
			clearTimeout(_this2.timeoutId);
			clearInterval(_this2.intervalId);
			if (typeof _this2.config.resoleHandler === 'function') {
				return _this2.config.resoleHandler.call(_this2, rs, url);
			}
			return rs;
		}).catch(function (err) {
			clearTimeout(_this2.timeoutId);
			clearInterval(_this2.intervalId);
			if (err instanceof Error) {
				err = {
					type: 'err',
					msg: err.message,
					error: err
				};
			}
			err = _extends({}, err, {
				fetch: _this2,
				url: url
			});
			if (typeof _this2.config.rejectHandler === 'function') {
				var newErr = _this2.config.rejectHandler.call(_this2, err, url);
				if (typeof newErr === 'undefined') newErr = err;
				return Promise.reject(newErr);
			} else {
				return Promise.reject(err);
			}
		});
	};
	/**
  * 忽略请求，清除资源
  */


	SuperFetch.prototype.abort = function abort() {
		if (!this.config.canAbort) return;
		this.isAbort = true;
		this.fetchPromise = null;
	};

	return SuperFetch;
}(BaseFetch);

export default SuperFetch;