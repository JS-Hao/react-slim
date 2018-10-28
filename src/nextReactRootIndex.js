class NextReactRootIndex {
	constructor(initNum) {
		this.index = initNum;
	}

	get() {
		return this.index++;
	}
}

export default new NextReactRootIndex(0);