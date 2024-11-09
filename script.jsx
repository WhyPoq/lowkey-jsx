function Colorizer({colors, children}) {
    children = Xjsx.getNonTextChildren(children)

    return children.map((child, ind) => {
        child.style.color = colors[ind % colors.length]
        return child
    })
}

function Counters({children}) {
    const counters = Xjsx.getNonTextChildren(children)

    function resetCounters() {
        counters.forEach(counter => {
            counter.reset()
        })
    }

    return [
        ...children,
        <button onClick={resetCounters}>Reset all</button>
    ]
}

function Counter({name, refs, cur}) {
    let count = 0;

    function displayCount() {
        refs.countText.textContent = count;
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
            <h3>Counter {name}</h3>
            <p>
                <span ref={countText}>{count}</span> 
                <button onClick={increaseCount}>Increase</button>
            </p>
        </div>
    )
}

function CountersExample() {
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

class ChangableField {
    constructor(initialContent) {
        this.content = initialContent
        this.parentComponent = undefined
    }

    updateParentTextContent() {
        this.parentComponent.textContent = this.content.toString()
    }

    get() {
        return this.content
    }

    set(newContent) {
        this.content = newContent
        if(this.parentComponent !== undefined)
            this.updateParentTextContent();
    }

    display() {
        const DummyChangableField = ({cur}) => {
            cur.onGotParent = (parent) => {
                this.parentComponent = parent
                this.updateParentTextContent();
            }

            return [];
        }

        return <DummyChangableField />
    }

    setChangeFunction(changeFunction) {
        this.changeFunction = changeFunction;
    }
}

function DynamicCounterExample() {
    const counter = new ChangableField(0)

    return (
        <div>
            <h3>My app</h3>
            <p>{counter.display()}</p>
            <button onClick={() => counter.set(counter.get() + 1)}>Click</button>
        </div>
    )
}

class ChangableArray {
    constructor(initialArr) {
        this.array = initialArr === undefined ? [] : initialArr
        this.components = []

        this.parentComponent = undefined
        this.pushHandler = undefined
    }
    
    get(i) {
        return this.array[i]
    }

    set(i, newValue) {
        this.array[i] = newValue
    }

    remove(i) {
        if(i < this.components.length) {
            this.components[i].remove()
            this.components.splice(i, 1)
        }
        this.array.splice(i, 1)

        // update indexes for each component
        this.components.forEach((component, ind) => {
            if(component.updateInd !== undefined && typeof component.updateInd === "function")
                component.updateInd(ind)
        })
    }

    appendChildToParent(newComponent) {
        this.parentComponent.appendChild(newComponent)
    }

    pushComponent(value) {
        const newComponent = this.pushHandler(value, this.components.length)
        this.components.push(newComponent)  

        if(this.parentComponent !== undefined) {
            this.appendChildToParent(newComponent)
        }
    }

    push(value) {
        this.array.push(value)
        if(this.pushHandler !== undefined)
            this.pushComponent(value)
    }

    display(pushHandler) {
        const DummyChangableArray = ({cur}) => {
            cur.onGotParent = (parent) => {
                this.parentComponent = parent
                this.components.forEach((component) => this.appendChildToParent(component))
            }
            return []
        }

        this.pushHandler = pushHandler
        this.array.forEach((value, ind) => this.pushComponent(value, ind))

        return <DummyChangableArray />
    }
}

function ArrayElement({value, increaseFunc, removeFunc, ind, cur, refs}) {
    const cvalue = new ChangableField(value)

    function increase() {
        const newValue = increaseFunc(ind) 
        cvalue.set(newValue)
    }

    function remove() {
        removeFunc(ind)
    }

    cur.updateInd = (newInd) => {
        ind = newInd;
        refs.indText.textContent = (ind + 1) + ": ";
    }

    return (
        <li style={"display: flex; gap: 20px"}>
            <span ref={indText}>{ind + 1}: </span>
            <span>{cvalue.display()}</span>
            <button onClick={increase}>Increase</button>
            <button onClick={remove}>Delete</button>
        </li>
    )
}

function DynamicArrayExample() {
    const arr = new ChangableArray([1, 2, 3])
    let nextValue = 4;

    function addElement() {
        arr.push(nextValue)
        nextValue++;
    }

    function increaseVal(ind) {
        const newValue = arr.get(ind) + 1
        arr.set(ind, newValue)
        return newValue
    }

    function removeEl(ind) {
        arr.remove(ind)
    }

    return [
        <button onClick={addElement}>Add</button>,
        <ul style={"display: flex; flex-direction: column; gap: 10px"}>
            {arr.display((value, ind) => {
                return <ArrayElement value={value} ind={ind} increaseFunc={increaseVal} removeFunc={removeEl}/>
            })}
        </ul>
    ]
}

function App() {
    return [
        <h2>Counters:</h2>,
        <CountersExample />,

        <h2 style="margin-top: 50px">Dynamic Counter:</h2>,
        <DynamicCounterExample />,

        <h2 style="margin-top: 50px">Dynamic Array:</h2>,
        <DynamicArrayExample />
    ]
}



Xjsx.render(<App />, "app");