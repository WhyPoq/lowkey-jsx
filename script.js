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
        Xjsx.create("button", {onClick: resetCounters}, document.createTextNode(`Reset all`))
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
        Xjsx.create("div", {}, document.createTextNode(`
            `), Xjsx.create("h3", {}, document.createTextNode(`Counter `), name), document.createTextNode(`
            `), Xjsx.create("p", {}, document.createTextNode(`
                `), Xjsx.create("span", {ref: ["countText", refs]}, count), document.createTextNode(` 
                `), Xjsx.create("button", {onClick: increaseCount}, document.createTextNode(`Increase`)), document.createTextNode(`
            `)), document.createTextNode(`
        `))
    )
}

function CountersExample() {
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

        return Xjsx.create(DummyChangableField, {})
    }

    setChangeFunction(changeFunction) {
        this.changeFunction = changeFunction;
    }
}

function DynamicCounterExample() {
    const counter = new ChangableField(0)

    return (
        Xjsx.create("div", {}, document.createTextNode(`
            `), Xjsx.create("h3", {}, document.createTextNode(`My app`)), document.createTextNode(`
            `), Xjsx.create("p", {}, counter.display()), document.createTextNode(`
            `), Xjsx.create("button", {onClick: () => counter.set(counter.get() + 1)}, document.createTextNode(`Click`)), document.createTextNode(`
        `))
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

        return Xjsx.create(DummyChangableArray, {})
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
        Xjsx.create("li", {style: "display: flex; gap: 20px"}, document.createTextNode(`
            `), Xjsx.create("span", {ref: ["indText", refs]}, ind + 1, document.createTextNode(`: `)), document.createTextNode(`
            `), Xjsx.create("span", {}, cvalue.display()), document.createTextNode(`
            `), Xjsx.create("button", {onClick: increase}, document.createTextNode(`Increase`)), document.createTextNode(`
            `), Xjsx.create("button", {onClick: remove}, document.createTextNode(`Delete`)), document.createTextNode(`
        `))
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
        Xjsx.create("button", {onClick: addElement}, document.createTextNode(`Add`)),
        Xjsx.create("ul", {style: "display: flex; flex-direction: column; gap: 10px"}, document.createTextNode(`
            `), arr.display((value, ind) => {
                return Xjsx.create(ArrayElement, {value: value, ind: ind, increaseFunc: increaseVal, removeFunc: removeEl})
            }), document.createTextNode(`
        `))
    ]
}

function App() {
    return [
        Xjsx.create("h2", {}, document.createTextNode(`Counters:`)),
        Xjsx.create(CountersExample, {}),

        Xjsx.create("h2", {style: "margin-top: 50px"}, document.createTextNode(`Dynamic Counter:`)),
        Xjsx.create(DynamicCounterExample, {}),

        Xjsx.create("h2", {style: "margin-top: 50px"}, document.createTextNode(`Dynamic Array:`)),
        Xjsx.create(DynamicArrayExample, {})
    ]
}



Xjsx.render(Xjsx.create(App, {}), "app");