// React Component
class Component {
	constructor(props) {
		this.props = props;
	}

	setState(newState) {
		this._reactInternalInstance.receiveComponent(null, newState);
	}
}