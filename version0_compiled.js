function RandomColor({ children, ref }) {
	function recolor() {
		children.forEach(
			(child) =>
				(child.style.color = `${["red", "green", "blue"][Math.floor(Math.random() * 3)]}`)
		);
	}

	recolor();
	ref.recolor = recolor;

	return children;
}

function Counter({ ref }) {
	const els = {};

	let curVal = 0;
	function handleClick() {
		curVal++;
		els.p.textContent = curVal;
	}

	return [
		Xjsx.create("p", { ref: ["p", els] }, curVal),
		Xjsx.create("button", { onClick: handleClick }, "Click"),
	];
}

function App() {
	const els = {};

	const jsx = Xjsx.create(
		RandomColor,
		{ ref: ["randomColoring", els] },
		Xjsx.create("h1", { style: "text-decoration: underline" }, "Heading"),
		Xjsx.create(Counter, {}),
		Xjsx.create(Counter, {})
	);

	setInterval(els.randomColoring.recolor, 1000);

	return jsx;
}

Xjsx.render(App(), "app");
