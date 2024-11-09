Xjsx = (() => {
	const Xjsx = {};

	const eventsSet = new Set(["click", "mouseover"]);

	Xjsx.unpackChildren = function (children) {
		const unpacked = [];

		children.forEach((child) => {
			if (child instanceof Array) {
				const innerChildren = Xjsx.unpackChildren(child);
				innerChildren.forEach((innerChild) => unpacked.push(innerChild));
			} else {
				unpacked.push(child);
			}
		});

		return unpacked;
	};

	Xjsx.getNonTextChildren = function (children) {
		return children.filter((child) => child.nodeType !== Node.TEXT_NODE);
	};

	Xjsx.getTextChildren = function (children) {
		return children.filter((child) => child.nodeType === Node.TEXT_NODE);
	};

	function getAllChildrenArrays(children, childrenArrays) {
		children.forEach((child) => {
			if (child instanceof Array) {
				childrenArrays.push(child);
				getAllChildrenArrays(child, childrenArrays);
			}
		});
	}

	Xjsx.create = function (type, props, ...children) {
		let allChildrenArrays = [];
		getAllChildrenArrays(children, allChildrenArrays);

		children = Xjsx.unpackChildren(children);

		let el;
		if (typeof type === "function") {
			const cur = {};
			el = type({ ...props, children, refs: {}, cur });

			if (props.ref !== undefined) {
				const [varName, refs] = props.ref;
				refs[varName] = el;
			}

			// add onGotParent even to the Array object
			if (cur.onGotParent !== undefined) {
				el.onGotParent = cur.onGotParent;
				delete cur.onGotParent;
			}

			if (Object.keys(cur).length > 0) {
				if (el instanceof Array) {
					const componentName = type.name;
					const prefixString = componentName ? `'${componentName}' component: ` : "";

					throw new Error(
						prefixString +
							"Cannot set methods (using 'cur') on element which returns several element (an array). Except for 'onGotParent' callback"
					);
				}

				for (const key in cur) {
					el[key] = cur[key];
				}
			}
		} else {
			el = document.createElement(type);
			if (props.ref !== undefined) {
				const [varName, refs] = props.ref;
				refs[varName] = el;
			}

			for (const propName in props) {
				if (propName === "ref") continue;

				const propValue = props[propName];
				let isEventHandler = false;
				// if it is adding event handler (for examle, onClick)
				if (propName.length >= 2 && propName.startsWith("on")) {
					let eventName = propName.slice(2);
					eventName = eventName[0].toLowerCase() + eventName.slice(1);
					if (eventsSet.has(eventName)) {
						el.addEventListener(eventName, propValue);
						isEventHandler = true;
					}
				}

				if (!isEventHandler) el.setAttribute(propName, propValue);
			}

			children.forEach((child) => el.append(child));
		}

		// call callback on children to pass them their parent (current element)
		children.forEach((child) => {
			if (child.onGotParent) child.onGotParent(el);
		});

		allChildrenArrays.forEach((childrenArray) => {
			if (childrenArray.onGotParent) childrenArray.onGotParent(el);
		});

		return el;
	};

	Xjsx.render = function (component, rootId) {
		const root = document.getElementById(rootId);
		if (root === null) throw new Error(`root with id ${rootId} does not exist`);

		if (component instanceof Array) {
			const unpackedChildren = Xjsx.unpackChildren(component);
			unpackedChildren.forEach((c) => root.append(c));
		} else {
			root.append(component);
		}
	};

	return Xjsx;
})();
