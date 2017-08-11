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
import BaseFetch from './BaseFetch'
const defaultConfig = {
	// 成功处理函数
	// 处理拦截器，函数数组，可定义请求响应且默认处理完毕之后的promise
	// function(rs){}
	resoleHandler: null,
	// 拒绝处理函数
	// function(err){}
	rejectHandler: null,
	// 超时毫秒数
	timeout: 10*1000,
	timeoutMsg: '请求超时',
	abortMsg: '请求被忽略',
	// 是否可忽略
	canAbort: true
}
export default class SuperFetch extends BaseFetch{
	constructor(conf){
		super(conf);
		this.config = Object.assign({}, defaultConfig, this.config)
		this.timeoutId = null;
		this.isAbort = false;
	}
	/**
	 * 发送请求
	 */
	fetch(url, fetchConf = {}){
		let baseFetchPromise = super.fetch(url, fetchConf);

		this.fetchPromise = Promise.race([
			baseFetchPromise,
			// 忽略检测
			new Promise((resolve, reject) => {
				if(this.config.canAbort){
					this.intervalId = setInterval(() => {
						if(this.isAbort){
							reject({
								type: 'abort',
								msg: this.config.abortMsg,
								error: new Error(this.config.abortMsg)
							})
						}
					}, 300)
				}
			}),
			// 超时处理
			new Promise((resolve, reject) => {
				this.timeoutId = setTimeout(() => reject({
					type: 'timeout',
					msg: this.config.timeoutMsg,
					error: new Error(this.config.timeoutMsg)
				}), this.config.timeout)
			}) 
		]);
		return this.fetchPromise.then(rs=>{
			clearTimeout(this.timeoutId);
			clearInterval(this.intervalId);
			if(typeof this.config.resoleHandler === 'function'){
				return this.config.resoleHandler.call(this, rs, url);
			}
			return rs;
		}).catch(err=>{
			clearTimeout(this.timeoutId);
			clearInterval(this.intervalId);
			if(err instanceof Error){
				err =  {
					type: 'err',
					msg: err.message,
					error: err,
				}
			}
			err = {
				...err,
				fetch: this,
				url
			}
			if(typeof this.config.rejectHandler === 'function'){
				let newErr = this.config.rejectHandler.call(this, err, url);
				if(typeof newErr === 'undefined') newErr = err;
				return Promise.reject(newErr);
			}else{
				return Promise.reject(err);
			}
		})
	}
	/**
	 * 忽略请求，清除资源
	 */
	abort(){
		if(!this.config.canAbort) return;
		this.isAbort = true;
		this.fetchPromise = null;
	}
}