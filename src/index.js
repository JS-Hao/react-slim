// likereact并没有使用jsx的语法糖，故部分内容需要手动调用方法
// Component是React的Component，一般作为基类被自定义组件所继承，如App extends Component
// createElement的作用是创建出虚拟DOM元素, 在jsx中的一般写法是： <App {...props}>, 而在这里改为： createElement(App, props)
// render的语法格式与React保持一致

import createElement from './createElement';
import Component from './Component';
import render from './render';

const React = {
	createElement,
	Component,
	render,
}