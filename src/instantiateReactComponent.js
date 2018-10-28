import { isString, isObject, isFunction, isNumber, forEach } from 'lodash';
import { on } from 'delegated-events';
import EventEmitter from 'eventemitter';

function instantiateReactComponent(node){
  if (isString(node) || isNumber(node)){
    return new ReactDOMTextComponent(node);
  } 

  if (isObject(node) && isString(node.type)) {
  	return new ReactDOMComponent(node);
  }

  if (isObject(node) && typeof isFunction(node.type)) {
  	return new ReactCompositeComponent(node);
  }
}

// 纯文字or数字组件，无状态，无key，纯渲染
class ReactDOMTextComponent {
	constructor(text) {
		this._currentElement = '' + text;
		this._rootNodeID = null;
	}

	mountComponent(rootID) {
		this._rootNodeID = rootID;
		return '<span data-reactid="' + rootID + '">' + this._currentElement + '</span>';
	}
}

class ReactDOMComponent {
	constructor(element) {
		this._currentElement = element;
		this._rootNodeID = null;
	}

	mountComponent(rootID) {
		this._rootNodeID = rootID;
		const props = this._currentElement.props;
		let tagOpen = `<${ this._currentElement.type }`;
		const tagClose = `</${ this._currentElement.type }>`;

		tagOpen += ' data-reactid=' + this._rootNodeID;

		// 将属性拼接到html中
		forEach(props, (value, name) => {
			// 事件
			if (/^on[A-Za-z]/.test(name)) {
				const eventType = name.replace('on', '').toLowerCase();
				on(eventType, `[data-reactid="${ this._rootNodeID }"]`, value);
			} else if (value && name !== 'children') {
				tagOpen += ` ${name}=${value}`;
			}
		})

		// 递归渲染子组件
		let content = '';
		const children = props.children || [];
		const childrenInstances = [];

		children.forEach((child, key) => {
			const childComponentInstance = instantiateReactComponent(child);
			childComponentInstance._mountIndex = key;
			childrenInstances.push(childComponentInstance);

			const childRootId = this._rootNodeID + '.' + key;
			const childMarkup = childComponentInstance.mountComponent(childRootId);
			content += ' ' + childMarkup;
		});

		// 将子组件实例数组保存起来，后续更新时用得上
		this._renderedChildren = childrenInstances;
		return tagOpen + '>' + content + tagClose;
	}
}

// 最常用的react custom component
class ReactCompositeComponent {
	constructor(element) {
		this._currentElement = element;
		this._rootNodeID = null;
		this._instance = null;
	}

	// 在setState或者父组件传入的props变更时（其实就是传入个新component啦哈哈哈）
	// 对于根组件（即无父组件的最顶层组件）而言，能触发重新渲染的唯有setState, 
	// state状态改变后，将之前的render元素与当前的相比较判断是否要更新，
	// 若render元素也是一个custom component，则调用它的receiveComponent并传入新的reactElement,
	// 这个过程从react文档角度看，就是“上层组件向下层组件传递的props改变了”
	receiveComponent(nextElement, newState) {
		this._currentElement = nextElement || this._currentElement;
		const nextState = Object.assign({}, this._instance.state, newState);
		const nextProps = this._currentElement.props;

		this._instance.state = nextState;

		// 这里阐释了shouldComponentUpdate为何可以不让组件更新
		if (this._instance.shouldComponentUpdate && this._instance.shouldComponentUpdate(nextProps, nextState) === false) {
			return;
		}

		if (this._instance.componentWillUpdate) {
			this._instance.componentWillUpdate(nextProps, nextState);
		}

		const prevComponentInstance = this._renderedComponent;
		const prevRenderedElement = prevComponentInstance._currentElement;
		// 因为state or props变了，所以重新render一个新的reactElement
		const nextRenderedElement = this._instance.render();

		if (_shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
			prevComponentInstance.receiveComponent(nextRenderedElement);
			this._instance.componentDidUpdate && this._instance.componentDidUpdate();
		} else {
			// 如果发现是完全两种不同的element，则直接重新渲染
			this._renderedComponent = instantiateReactComponent(nextRenderedElement);
			const nextMarkUp = this._renderedComponent.mountComponent(this._rootNodeID);
			// 替换整个节点
			document.querySelector(`[data-reactid=${this._rootNodeID}]`).innerHTML = nextMarkUp;
		}

		this._instance.props = nextProps;
	}

	mountComponent(rootID) {
		this._rootNodeID = rootID;

		const props = this._currentElement.props,
			CustomComponent = this._currentElement.type,
			this._instance = new CustomComponent(props),
			this._instance._reactInternalInstance = this;

			// componentWillMount
			if (this._instance.componentWillMount) {
				this._instance.componentWillMount();
			}

			// 在常规下react render方法返回的是一个jsx语法糖包裹的reactElement
			// 获取reactElement后还需实例化它
			const renderedElement = this._instance.render();
			this._renderedComponent = instantiateReactComponent(renderedElement);
			const rendererMarkup = this._renderedComponent.mountComponent(this._rootNodeID);

			// 这里可以很好地解释为什么子组件的componentDidMount会先与父组件的：
			// 跟据递归的规律，子组件会先于父组件监听mountReady事件，故此发生此现象
			EventEmitter.on('mountReady', () => {
				this._instance.componentDidMount && this._instance.componentDidMount();
			})
			return rendererMarkup;
	}
}

// 判断两个元素应不应该更新
// 原则：若前后元素的种类、type、key未发生改变，则更新之，否则则完全替换之
// bug: 这里有个漏洞，非custom component是没有receiveComponent的
const _shouldUpdateReactComponent = function(prevElement, nextElement) {
	if (prevElement !== null && nextElement !== null) {
		const prevType = typeof prevElement,
			nextType = typeof nextElement;

		if (prevType === 'string' || prevType === 'number') {
			return nextType === 'string' || nextType === 'number';
		} else {
			return nextType === 'object' && prevElement.type === nextType.type && prevElement.key === nextElement.key;
		}
	}
	return false;
}

