/**
 * 兼容低版本浏览器
 * http://caniuse.com/#search=Fetch
 * 不支持原生fetch浏览器：
 * Safari 10.1 以下
 * IE全部版本
 * 
 * 兼容nodejs平台
 */
import 'isomorphic-fetch';
export { default } from './lib';