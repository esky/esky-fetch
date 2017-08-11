/**
 * 兼容低版本浏览器
 * http://caniuse.com/#search=Fetch
 * 不支持原生fetch浏览器：
 * Safari 10.1 以下
 * IE全部版本
 * 
 * 兼容nodejs平台
 */
import 'isomorphic-fetch'
import Fetch from './src'
import { getDefaultConfig } from './src'
let _Fetch = Fetch;
// 浏览器端扩展
if (window) {
	let _defaultConfig = {
		// 文件导出时间
		exportTimeout: 3 * 60 * 1000
	}
	Object.assign(_Fetch, {
		file: (url, params = {}, filename) => {
			let defaultConfig = Object.assign(_defaultConfig, getDefaultConfig()) 
			return Fetch.create({
				type: 'blob',
				resoleHandler: null,
				rejectHandler: null,
				// 超时毫秒数
				timeout: defaultConfig.exportTimeout
			}).post(url, params).then(res => {
				// 获取文件名
				let type = decodeURI(res.headers.get('export-type')),
					fileName = res.headers.get('content-disposition'),
					exportName = res.headers.get('export-filename');
				if (type === 'json') {
					// 返回错误数据
					return Promise.reject(res)
				} else {
					if (fileName) {
						fileName = fileName.match(/filename=(\S+\.[a-zA-Z0-9]+$)/)[1]
					} else {
						fileName = exportName
					}
					filename = filename || decodeURI(fileName)
					// 返回blob数据
					return res.blob()
				}
			}).then(blob => {
				// 创建a标签, 输出文件
				let link = document.createElement('a'),
					fileurl = window.URL.createObjectURL(blob)
				link.href = fileurl
				link.download = filename
				link.click()
				window.URL.revokeObjectURL(fileurl)
				return {
					retcode: 200,
					retdesc: '文件导出成功'
				}
			}, res => {
				return res.json()
			}).then(json => {
				let { retcode, retdesc } = json
				return new Promise((resolve, reject) => {
					let result = {
						type: 'export',
						code: retcode,
						msg: retdesc
					}
					retcode === 200 ? resolve(result) : reject(result)
				})
			}, err => {
				console.log(err)
			});
		},
	})
}
export default _Fetch
