import instantiateReactComponent from './instantiateReactComponent';
import nextReactRootIndex from './nextReactRootIndex';
import eventemitter from 'eventemitter';

function render(component, container) { 
	const componentInstance = instantiateReactComponent(component);
	const markup = componentInstance.mountComponent(nextReactRootIndex.get());
	container.innerHTML = markup;
	eventemitter.trigger('mountReady');
}