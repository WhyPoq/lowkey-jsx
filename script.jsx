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
        <button onClick={resetCounters}>Reset all</button>
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
        <div>
            <h2>Counter {name}</h2>
            <p>
                <span ref={countText}>{count}</span> 
                <button onClick={increaseCount}>Increase</button>
            </p>
        </div>
    )
}

function App() {
    return (
        <Counters>
            <Colorizer colors={["red", "purple", "magenta"]}>
                <Counter name="1"/>
                <Counter name="2"/>
                <Counter name="3"/>
            </Colorizer>
        </Counters>
    )
}



Xjsx.render(<App />, "app");