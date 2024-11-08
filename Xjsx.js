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

	Xjsx.create = function (type, props, ...children) {
		children = Xjsx.unpackChildren(children);

		let el;
		if (typeof type === "function") {
			if (props.ref !== undefined) {
				const [varName, els] = props.ref;
				els[varName] = {};
				props.ref = els[varName];
			}

			const cur = {};
			el = type({ ...props, children, els: {}, cur });

			if (Object.keys(cur).length > 0) {
				if (el instanceof Array) {
					const componentName = type.name;
					const prefixString = componentName ? `'${componentName}' component: ` : "";

					throw new Error(
						prefixString +
							"Cannot set methods (using 'cur') on element which returns several element (an array)"
					);
				}
				el.cur = cur;
			}
		} else {
			el = document.createElement(type);
			if (props.ref !== undefined) {
				const [varName, els] = props.ref;
				els[varName] = el;
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

		Xjsx.getNonTextChildren = function (children) {
			return children.filter((child) => child.nodeType !== Node.TEXT_NODE);
		};

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
