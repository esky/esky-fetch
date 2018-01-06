/**
 * 基础fetch类
 * @author esky
 * 
 * 网络响应状态异常
 * {
 *  type: 'status'
 * 	status: 404,
 * 	msg: '',
 * 	response
 * }
 */

const defaultConfig = {
	/**
	 * 请求host或前缀
	 * 1. 请求域名+前缀，如 //www.xxx.com/api
	 * 2. 仅前缀，此时默认当前域名，如 /api
	 * 3. 对象，可配置多个，此时需配合hostKey使用，如 { base: '/api', pay: '//pay.xxx.com/api' }
	 * 示例： 设置默认配置 `hostKey: 'base'` 默认使用base，也可以创建其它域名的请求 Fetch.create({ hostKey:'pay'}).get...
	 */
	host: '',
	// 当前使用host对应的key
	hostKey: '',
	/**
	 * 公共参数
	 * Object/Function
	 */
	params: null,
	/**
	 * 参数序列化urlParam之前的处理器，可以在此处做统一加密
	 * 支持返回异步promise
	 */
	beforeUrlParamHandler: null,
	/**
	 * 参数序列化之后的处理器
	 */
	afterUrlParamHandler: null,
	/**
	 * 发送请求前，有返回值则不再发请求
	 * 可以拿到请求地址和参数，返回promise自己来发请求
	 * Fetch.create({ beforeFetchHandler: function(url, fetchConf){
	 * 		return ajaxPromise()
	 * }, resoleHandler: null }).then(rs)
	 */
	beforeFetchHandler: null,
	/**
	 * 格式化函数
	 * formatHandler(res, contentType)
	 */
	formatHandler: null,
	// 请求状态消息文案
	statusMsg: {},
	/**
	 * fetch 原生配置对象
	 * https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalFetch/fetch
	 */
	fetchConf: {}
};
export default class BaseFetch {
	// 当前请求的url
	url = ''
	// 当前请求的fetch配置
	fetchConf = null
	// 未处理前的原始地址
	srcUrl = ''
	// 未处理前的参数对象
	srcParams = null
	// 待发送的参数对象（处理后的，最终参数对象）
	handledParams = null
	// 最终发送的body
	bodyParam = null
	// 当前响应对象
	response = null
	// 当前响应类型 json text blob
	responseType = ''
	constructor(conf) {
		// 当前启用fetch的promise对象
		this.fetchPromise = null;
		// 配置
		this.config = Object.assign({}, defaultConfig, conf)
	}
	/**
	 * 发送请求
	 */
	fetch(url, fetchConf = {}) {
		let { beforeFetchHandler } = this.config;
		this.url = url;
		// 私有配置fetchConf与默认配置合并
		this.fetchConf = Object.assign({}, this.config.fetchConf, fetchConf);
		// 请求前的处理
		if (beforeFetchHandler) {
			// 最后一次机会修改this.url, this.fetchConf
			let beforeFetchRs = beforeFetchHandler.call(this, this.url, this.fetchConf);
			// 有返回值则组件自身不发请求，直接使用返回值
			if (beforeFetchRs !== undefined) {
				// 为promise则使用
				if (this.isPromise(beforeFetchRs)) return beforeFetchRs;
				// 不是promise则包装成promise
				return Promise.resolve(beforeFetchRs);
			}
		}
		this.fetchPromise = fetch(this.url, this.fetchConf)
			.then(this.checkErr.bind(this))
			.then(this.format.bind(this));
		return this.fetchPromise;
	}
	/**
	 * 重复最近一次请求
	 */
	reload() {
		return this.fetch(this.url, this.fetchConf)
	}
	get(url, params = {}, fetchConf = {}) {
		let bodyParam = this.handParam(params, url);
		url = this.fillUrl(url);
		return this.fetchBodyParam({ method: 'GET', isParam2Url: true }, url, bodyParam, fetchConf);
	}
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
	 * @param {String} url 
	 * @param {Object} params 
	 * @param {Object} fetchConf
	 */
	post(url, params = {}, fetchConf = {}) {
		let bodyParam = this.handParam(params, url);
		url = this.fillUrl(url);
		let conf = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		}
		return this.fetchBodyParam(conf, url, bodyParam, fetchConf);
	}
	put(url, params = {}, fetchConf = {}) {
		fetchConf = Object.assign({ method: 'PUT' }, fetchConf);
		return this.post(url, params, fetchConf)
	}
	delete(url, params = {}, fetchConf = {}) {
		fetchConf = Object.assign({ method: 'DELETE' }, fetchConf);
		return this.get(url, params, fetchConf)
	}
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
	 * @param {String} url 
	 * @param {Object} params 
	 * @param {Object} fetchConf 
	 * @return Promise
	 */
	form(url, params = {}, fetchConf = {}) {
		let bodyParam = this.handParam(params, url, 'FormData');
		url = this.fillUrl(url);
		let conf = {
			method: 'POST',
			/**
			 *  WEB：不能自己设置Content-Type，因为文件上传需要带上boundary。正确格式：multipart/form-data; boundary=----WebKitFormBoundaryyEmKNDsBKjB7QEqu
			 * 	客户端：同样不用设置 headers: { 'Content-Type': 'multipart/form-data', }
			 * 	总结：
			 * 	1. 非FormData，若不设置请求头，fetch会给你默认加上一个Content-type = text/xml类型的请求头
			 * 	2. FormData方式，会自动设置 Content-type = multipart/form-data; boundary= 。因为不知道那个boundary的定义方式，我们不自己设置Content-type。
			 */
			// headers: { }
		}
		return this.fetchBodyParam(conf, url, bodyParam, fetchConf);
	}
	fetchBodyParam(conf, url, bodyParam, fetchConf) {
		// 参数是否拼接到URI
		let isParam2Url = conf.isParam2Url || fetchConf.isParam2Url;
		let bodyHandler = fetchConf.body;
		let bodyParamHandler = bodyParam => {
			if (isParam2Url) {
				return this.fetch(this.fillParam2Url(url, bodyParam), Object.assign(conf, fetchConf))
			} else {
				// body可以是函数
				if (typeof bodyHandler === 'function') {
					fetchConf.body = bodyHandler.call(this, bodyParam);
				}
				return this.fetch(url, Object.assign(conf, { body: bodyParam }, fetchConf))
			}
		}
		// bodyParam支持promise异步处理，比如异步加密
		if (this.isPromise(bodyParam)) return bodyParam.then(bodyParamHandler);
		return bodyParamHandler(bodyParam)
	}
	isPromise(promise) {
		return promise && promise.then && typeof promise.then === 'function';
	}
	handParam(params, url, type) {
		// 缓存原始地址
		this.srcUrl = url;
		// 缓存原始参数
		this.srcParams = params;
		// 合并公共参数
		params = this.mergeComParams(params);
		let { beforeUrlParamHandler } = this.config;
		// 参数序列化前
		beforeUrlParamHandler && (params = beforeUrlParamHandler.call(this, params));
		let paramsHandler = params => {
			// 缓存处理后的参数对象
			this.handledParams = params;
			return this.handBodyParam(params, type)
		}
		// 支持异步参数处理，例如异步加密等
		if (this.isPromise(params)) return params.then(paramsHandler);
		return paramsHandler(params)
	}
	/**
	 * 把params处理成fetch需要的body
	 * body：可能是一个Blob、BufferSource、FormData、URLSearchParams、USVString
	 * @param {Object} params 普通参数对象
	 * @param {String} type 
	 */
	handBodyParam(params, type = 'URLSearchParams') {
		let { afterUrlParamHandler } = this.config;
		// 最终传给body的参数格式
		let bodyParam;
		// 目前支持FormData、URLSearchParams，其它暂未实现
		switch (type) {
			case 'URLSearchParams':
				bodyParam = this.obj2UrlParam(params);
				break;
			case 'FormData':
				bodyParam = this.obj2FormData(params)
				break;
			default:
				bodyParam = this.obj2UrlParam(params);
		}
		// 参数序列化后
		afterUrlParamHandler && (bodyParam = afterUrlParamHandler.call(this, bodyParam));
		// 缓存最终参数
		this.bodyParam = bodyParam;
		return bodyParam;
	}
	/**
	 * 合并公共参数
	 */
	mergeComParams(params) {
		let comParams = this.config.params;
		if (!comParams) return params;
		if (typeof comParams === 'function') {
			comParams = comParams.call(this, params);
		}
		if (typeof comParams === 'object') {
			return Object.assign({}, comParams, params)
		}
		return comParams;
	}
	/**
	 * 拼接参数到url地址
	 */
	fillParam2Url(url, urlParams) {
		if (urlParams && urlParams.length) {
			return url + (url.indexOf('?') === -1 ? '?' : '') + urlParams;
		}
		return url
	}
	/**
	 * 检查请求异常状态
	 * 服务器返回 400，500 错误码时并不会 reject，只有网络错误这些导致请求不能完成时，fetch 才会被 reject。
	 */
	checkErr(res = {}) {
		let { statusMsg } = this.config
		if (!res || res.status != 200) {
			return Promise.reject({
				type: 'status',
				status: '' + res.status,
				msg: statusMsg[res.status + ''] || '网络请求异常',
				response: res
			});
		}
		return res;
	}
	/**
	 * 默认的格式化
	 * 自动处理对应类型的响应
	 * 自定义则使用formatHandler
	 */
	format(res) {
		let contentType = res.headers.get('Content-Type');
		// 保存当前响应对象
		this.response = res;
		// 自定义格式化
		let selfRes, formatHandler = this.config.formatHandler;
		if (formatHandler) {
			selfRes = formatHandler.call(this, res, contentType);
			if (selfRes) return selfRes;
		}
		if (/json/.test(contentType)) {
			this.responseType = 'json';
			return res.json();
		}
		if (/text/.test(contentType)) {
			this.responseType = 'text';
			return res.text();
		}
		if (/image/.test(contentType)) {
			this.responseType = 'blob';
			return res.blob();
		}
		// 其它类型 自己处理 比如：视频等 arrayBuffer()
		return res;
	}
	/**
	 * 对象转换成参数串
	 */
	obj2UrlParam(obj = {}) {
		let urlParam = [];
		for (let k in obj) {
			if (obj[k] === '' || obj[k] === undefined || obj[k] === null) continue;
			urlParam.push(k + '=' + encodeURIComponent(obj[k]));
		}
		return urlParam.join('&');
	}
	/**
	 * 对象转换成FormData
	 */
	obj2FormData(obj = {}) {
		let formData = new FormData();
		for (let k in obj) {
			formData.append(k, obj[k])
		}
		return formData;
	}
	/**
	 * 补全URL地址
	 */
	fillUrl(url) {
		// 若地址含//或host非法 则不用补齐
		if (/\/\//.test(url)) {
			return url;
		}
		let host = this.config.host;
		if (typeof host === 'object') {
			host = host[this.config.hostKey]
		}
		// 最终地址由 host + url 拼接
		url = url.replace(/^\//, '');
		url = host + '/' + url;
		return url;
	}
}