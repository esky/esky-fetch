'use strict';

exports.__esModule = true;

var _SuperFetch = require('./SuperFetch');

var _SuperFetch2 = _interopRequireDefault(_SuperFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * 通用fetch组件
                                                                                                                                                           * https://fetch.spec.whatwg.org
                                                                                                                                                           * https://segmentfault.com/a/1190000003810652
                                                                                                                                                           * https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS
                                                                                                                                                           */


/**
 * 默认配置对象
 * 详情参见 BaseFetch和SuperFetch的defaultConfig
 */
var defaultConfig = {
	/**
 	method: 请求使用的方法，如 GET、POST。
 	headers: 请求的头信息，形式为 Headers 对象或 ByteString。
 	body: 请求的 body 信息：可能是一个 Blob、BufferSource、FormData、URLSearchParams 或者 USVString 对象。注意 GET 或 HEAD 方法的请求不能包含 body 信息。
 	mode: 请求的模式，如 cors、 no-cors 或者 same-origin。
 	credentials: 请求的 credentials，如 omit、same-origin 或者 include。
 	cache:  请求的 cache 模式: default, no-store, reload, no-cache, force-cache, or only-if-cached.
 		每当我们用 fetch 发起一个请求，其响应都会被赋予一个响应类型，'basic'，'cors' 或者 'opaque'。
 	如果请求是同源的，那么响应类型就是 'basic'，如果跨域的请求，则是 'cors'，如果对非同源的资源发起一个请求，并且其没有返回 CORS 头的话，则是 'opaque' 类型。
 	'opaque' 类型的响应我们将不能读取所返回的数据或者查看请求的状态，也就是说，我们压根没办法知道请求是否成功了。
 	我们可以在发起请求的时候，指定一个模式来确保只有相应的请求会被允许：
 	same-origin: 只有同源的请求才会被允许。
 	cors: 允许同源或者非同源但是返回正确 CORS 头部的请求。
 	cors-with-forced-preflight: 在正式请求之前，总是先发起一个 preflight 检查。
 	no-cors: 用以发起非同源又没有返回 CORS 头的请求。
 */
	fetchConf: {
		// Fetch 请求默认是不带 cookie 的，需要设置 fetch(url, {credentials: 'include'}
		credentials: 'include'
	}
};
/**
 * Fetch配置管理类
 * 提供快捷API方法
 */

var FetchManager = function () {
	function FetchManager(conf) {
		_classCallCheck(this, FetchManager);

		this.fetchList = [];
		this.defaultConfig = {};

		Object.assign(this.defaultConfig, defaultConfig, conf);
	}
	/**
  * 初始化默认配置
  * @param {*} conf 
  */


	FetchManager.prototype.init = function init(conf) {
		Object.assign(this.defaultConfig, conf);
	};
	/**
  * 创建新实例
  */


	FetchManager.prototype.instance = function instance(conf) {
		return new FetchManager(conf);
	};

	FetchManager.prototype.get = function get(url, params, fetchConf, conf) {
		return this.create(conf).get(url, params, fetchConf);
	};
	/**
  * 适用于大部分场景 
  * 默认使用 URLSearchParams
  * 使用fetchConf可以自定义post的body
  * 例如：
  * Fetch.post('url', { a: 3 }, {
  * 		headers: { 'Content-Type': '可自行指定' },
  * 		body: function(bodyParam){
  * 			// bodyParam是默认待发送的body
  * 			// 未处理前的参数对象 this.srcParams
  * 			// 待发送的参数对象（处理后的） this.handledParams
  * 			// 从上面数据确定最终要发送body
  * 			// 返回值，可能是一个Blob、BufferSource、FormData、URLSearchParams、USVString
  * 			return xxx
  * 		}
  * })
  */


	FetchManager.prototype.post = function post(url, params, fetchConf, conf) {
		return this.create(conf).post(url, params, fetchConf);
	};

	FetchManager.prototype.put = function put(url, params, fetchConf, conf) {
		return this.create(conf).put(url, params, fetchConf);
	};

	FetchManager.prototype.delete = function _delete(url, params, fetchConf, conf) {
		return this.create(conf).delete(url, params, fetchConf);
	};
	/**
  * 表单提交，适用于文件上传等
  * 普通参数与文件参数会一起通过FormData提交
  * 1. 客户端  
  * 	Fetch.form('upload', {
  *		'other': 2,
  *		// uri为本地图片资源路径 response.uri
  *		'file': { uri: uri, type: 'multipart/form-data', name: 'front.jpg' }
  *	})
  *
  * 2. 浏览器端  
  *	Fetch.form('upload', {
  *		'other': 1,
  *		// file对象
  *		'file': File
  *	})
  * 
  * @return Promise
  */


	FetchManager.prototype.form = function form(url, params, fetchConf, conf) {
		return this.create(conf).form(url, params, fetchConf);
	};
	/**
  * 创建SuperFetch对象
  * @param {*} conf 
  */


	FetchManager.prototype.create = function create(conf) {
		conf = Object.assign({}, this.defaultConfig, conf);
		var fetchObj = new _SuperFetch2.default(conf);
		this.fetchList.push(fetchObj);
		return fetchObj;
	};
	/**
  * 清理请求缓存
  */


	FetchManager.prototype.clear = function clear() {
		this.fetchList.forEach(function (item) {
			item.abort();
		});
		this.fetchList = [];
	};

	return FetchManager;
}();
/**
 * 单例
 * 可以使用Fetch.instance(conf)创建新的实例
 */


exports.default = new FetchManager();