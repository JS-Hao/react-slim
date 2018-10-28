import forEach from 'lodash/forEach';
import ReactElement from './ReactElement';

function createElement (type, props={}, children) {
	const selfProps = {};
	const key = props.key || null;

	forEach(props, (item, name) => {
		if (props.hasOwnProperty(name) && name !== 'key') {
			selfProps[name] = item;
		}
	});

	// 传入的children可能不止一个，无论多少我们都用数组来存储
	const childrenLength = arguments.length - 2;
	if (childrenLength === 1) {
		props.children = Array.isArray(children) ? children : [children];
	} else {
		props.children = Array.from(arguments).slice(2);
	}

	return new ReactElement(type, key, props);
}

export default createElement;