const { v4: uuidv4 } = require('uuid');

const store = []; // in-memory array

class BillboardMock {
	constructor(data = {}) {
		Object.assign(this, data);
		this._id = this._id || uuidv4();
	}

	async save() {
		const idx = store.findIndex((s) => s._id === this._id);
		if (idx >= 0) {
			store[idx] = { ...store[idx], ...this };
		} else {
			store.push({ ...this });
		}
		return this;
	}

	// static methods
	static async find(filter = {}) {
		// simple filtering for isVisible and other top-level equality props
		return store.filter((item) => {
			for (const key of Object.keys(filter)) {
				if (item[key] !== filter[key]) return false;
			}
			return true;
		});
	}

	static async findById(id) {
		const doc = store.find((s) => s._id === id);
		if (!doc) return null;
		// return a "doc" with save/remove
		const instance = new BillboardMock(doc);
		instance.remove = async () => {
			const i = store.findIndex((s) => s._id === id);
			if (i >= 0) store.splice(i, 1);
		};
		return instance;
	}

	static async countDocuments() {
		return store.length;
	}

	static async findByIdAndDelete(id) {
		const i = store.findIndex((s) => s._id === id);
		if (i >= 0) {
			const removed = store.splice(i, 1);
			return removed[0];
		}
		return null;
	}

	static async findByIdAndUpdate(id, update = {}, opts = {}) {
		const i = store.findIndex((s) => s._id === id);
		if (i === -1) return null;
		store[i] = { ...store[i], ...update };
		return opts.new ? store[i] : null;
	}
}

module.exports = BillboardMock;
