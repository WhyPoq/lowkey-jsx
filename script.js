function Colorizer({colors, children}) {
    return children.map((child, ind) => {
        if(child.nodeType !== Node.TEXT_NODE)
            child.style.color = colors[ind % colors.length]
        return child
    })
}

function Counters({children}) {
    const counters = Xjsx.getNonTextChildren(children)

    function resetCounters() {
        counters.forEach(counter => {
            counter.cur.reset()
        })
    }

    return [
        ...children,
        Xjsx.create("button", {onClick: resetCounters}, document.createTextNode(`Reset all`))
    ]
}

function Counter({name, els, cur}) {
    let count = 0;

    function displayCount() {
        els.countText.textContent = count;
    }

    function increaseCount() {
        count++;
        displayCount();
    }

    cur.reset = () => {
        count = 0;
        displayCount()
    }

    return (
        Xjsx.create("div", {}, document.createTextNode(`
            `), Xjsx.create("h2", {}, document.createTextNode(`Counter `), name), document.createTextNode(`
            `), Xjsx.create("p", {}, document.createTextNode(`
                `), Xjsx.create("span", {ref: ["countText", els]}, count), document.createTextNode(` 
                `), Xjsx.create("button", {onClick: increaseCount}, document.createTextNode(`Increase`)), document.createTextNode(`
            `)), document.createTextNode(`
        `))
    )
}

function App() {
    return (
        Xjsx.create(Counters, {}, document.createTextNode(`
            `), Xjsx.create(Colorizer, {colors: ["red", "purple", "magenta"]}, document.createTextNode(`
                `), Xjsx.create(Counter, {name: "1"}), document.createTextNode(`
                `), Xjsx.create(Counter, {name: "2"}), document.createTextNode(`
                `), Xjsx.create(Counter, {name: "3"}), document.createTextNode(`
            `)), document.createTextNode(`
        `))
    )
}



Xjsx.render(Xjsx.create(App, {}), "app");