const nodeOps = {
    createElement: (tagName) => document.createElement(tagName),
    remove: (child) => {
        const parent = child.parentNode;
        if (parent) {
            parent.removeChild(child);
        }
    },
    insert: (child, parent, anchor = null) => {
        parent.insertBefore(child, anchor);
    },
    querySelector: (selector) => document.querySelector(selector),
    setElementText: (element, text) => element.textContent = text,
    nextSibling: (node) => node.nextSibling,
    createText: (text) => document.createTextNode(text),
    setText: (node, text) => node.nodeValue = text
};

const patchAttr = (element, key, value) => {
    if (value === null) {
        element.removeAttribute(key);
    }
    else {
        element.setAttribute(key, value);
    }
};

const patchClass = (element, nextValue) => {
    if (nextValue === null) {
        nextValue = '';
    }
    element.className = nextValue;
};

const patchEvent = (element, key, value) => {
    const invokers = element._vei || (element._vei = {});
    const exists = invokers[key];
    if (value && exists) {
        exists.value = value;
    }
    else {
        const eventName = key.slice(2).toLocaleLowerCase();
        if (value) {
            const invoker = invokers[key] = createInvoker(value);
            element.addEventListener(eventName, invoker);
        }
        else {
            element.removeEventListener(eventName, exists);
            invokers[key] = undefined;
        }
    }
};
function createInvoker(value) {
    const invoker = (e) => {
        invoker.value(e);
    };
    invoker.value = value;
    return invoker;
}

const patchStyle = (element, prevValue, nextValue) => {
    const style = element.style;
    if (nextValue === null) {
        element.removeAttribute('style');
    }
    else {
        if (prevValue) {
            for (const key in prevValue) {
                if (nextValue[key] === null) {
                    style[key] = '';
                }
            }
        }
        for (const key in nextValue) {
            style[key] = nextValue[key];
        }
    }
};

const patchProp = (element, key, prevValue, nextValue) => {
    switch (key) {
        case 'class':
            patchClass(element, nextValue);
            break;
        case 'style':
            patchStyle(element, prevValue, nextValue);
            break;
        default:
            if (/^on[^a-z]/.test(key)) {
                patchEvent(element, key, nextValue);
            }
            else {
                patchAttr(element, key, nextValue);
            }
            break;
    }
};

let activeEffect;
let uid = 0;
function effect(fn, options) {
    let parent;
    const effectFn = () => {
        cleanup(effectFn);
        parent = activeEffect;
        activeEffect = effectFn;
        const res = fn();
        activeEffect = parent;
        return res;
    };
    effectFn.deps = [];
    effectFn.options = options;
    effectFn.id = uid++;
    if (!(options === null || options === void 0 ? void 0 : options.lazy)) {
        effectFn();
    }
    return effectFn;
}
const targetMap = new WeakMap();
function track(target, key) {
    if (!activeEffect)
        return;
    let depMap = targetMap.get(target);
    if (!depMap) {
        targetMap.set(target, (depMap = new Map()));
    }
    let deps = depMap.get(key);
    if (!deps) {
        depMap.set(key, (deps = new Set()));
    }
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
    console.log('触发track');
}
function trigger(taget, key) {
    const depMap = targetMap.get(taget);
    if (!depMap)
        return;
    const effects = depMap.get(key);
    const effectToRun = new Set();
    effects && effects.forEach(effectFn => {
        if (effectFn !== activeEffect) {
            effectToRun.add(effectFn);
        }
    });
    effectToRun.forEach(effectFn => {
        var _a;
        if ((_a = effectFn === null || effectFn === void 0 ? void 0 : effectFn.options) === null || _a === void 0 ? void 0 : _a.scheduler) {
            effectFn.options.scheduler(effectFn);
        }
        else {
            effectFn();
        }
    });
    console.log('触发trigger');
}
function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i];
        deps.delete(effectFn);
    }
    effectFn.deps.length = 0;
}

function reactive(target) {
    return createReactive(target);
}
function shallowReactive(target) {
    return createReactive(target, true);
}
function readonly(target) {
    return createReactive(target, false, true);
}
function createReactive(target, isShallow = false, isReadonly = false) {
    return new Proxy(target, {
        get(target, key, receiver) {
            if (key === 'raw') {
                return target;
            }
            track(target, key);
            const result = Reflect.get(target, key, receiver);
            if (isShallow) {
                return result;
            }
            if (typeof result === 'object' && result !== null) {
                return reactive(result);
            }
            return result;
        },
        set(target, key, newVal, receiver) {
            if (isReadonly) {
                console.warn(`${String(key)} is readonly`);
                return true;
            }
            const oldVal = target[key];
            const result = Reflect.set(target, key, newVal, receiver);
            if (target === receiver.raw) {
                if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
                    trigger(target, key);
                }
            }
            return result;
        },
        has(target, key) {
            track(target, key);
            return Reflect.has(target, key);
        }
    });
}

function ref(target) {
    const wrapper = {
        value: target
    };
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true
    });
    return reactive(wrapper);
}
function toRef(target, key) {
    const wrapper = {
        get value() {
            return target[key];
        },
        set value(value) {
            target[key] = value;
        }
    };
    return wrapper;
}
function toRefs(target) {
    const result = {};
    for (const key in target) {
        result[key] = toRef(target, key);
    }
    return result;
}

function computed(getter) {
    let value;
    let dirty = true;
    const effectFn = effect(getter, {
        lazy: true,
        scheduler() {
            if (!dirty) {
                dirty = true;
                trigger(obj, 'value');
            }
        }
    });
    const obj = {
        get value() {
            if (dirty) {
                value = effectFn();
                dirty = false;
            }
            track(obj, 'value');
            return value;
        }
    };
    return obj;
}

var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["FUNCTIONAL_COMPONENT"] = 2] = "FUNCTIONAL_COMPONENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 4] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 8] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 16] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOTS_CHILDREN"] = 32] = "SLOTS_CHILDREN";
    ShapeFlags[ShapeFlags["TELEPORT"] = 64] = "TELEPORT";
    ShapeFlags[ShapeFlags["SUSPENSE"] = 128] = "SUSPENSE";
    ShapeFlags[ShapeFlags["COMPONENT_SHOULD_KEEP_ALIVE"] = 256] = "COMPONENT_SHOULD_KEEP_ALIVE";
    ShapeFlags[ShapeFlags["COMPONENT_KEPT_ALIVE"] = 512] = "COMPONENT_KEPT_ALIVE";
    ShapeFlags[ShapeFlags["NULL_CHILDREN"] = 1024] = "NULL_CHILDREN";
    ShapeFlags[ShapeFlags["COMPONENT"] = 6] = "COMPONENT";
})(ShapeFlags || (ShapeFlags = {}));

const isObject = (value) => typeof value === 'object' && value !== null;
const isArray = Array.isArray;
const extend = Object.assign;
const isFunction = (value) => typeof value === 'function';
const isString = (value) => typeof value === 'string';
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

function createVNode(type, props, children = null) {
    const shapeFlag = isString(type) ? 1 : isObject(type) ? 4 : 0;
    const vnode = {
        __v_isVNode: true,
        type,
        props,
        children,
        component: null,
        el: null,
        key: props && props.key,
        shapeFlag
    };
    normalizeChildren(vnode, children);
    return vnode;
}
function normalizeChildren(vnode, children) {
    let type = 0;
    if (children === null) {
        type = 1024;
    }
    else if (isArray(children)) {
        type = 16;
    }
    else {
        type = 8;
    }
    vnode.shapeFlag |= type;
}
const TEXT = Symbol('Text');
function normalizeVNode(child) {
    if (isObject(child))
        return child;
    return createVNode(TEXT, null, String(child));
}
function isVNode(vnode) {
    return vnode.__v_isVNode ? true : false;
}
function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
}

function createAppAPI(render) {
    return function createApp(rootComponent, rootProps) {
        const app = {
            _props: rootProps,
            _component: rootComponent,
            _container: null,
            mount(container) {
                const vnode = createVNode(rootComponent, rootProps);
                render(vnode, container);
                app._container = container;
            }
        };
        return app;
    };
}

const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        if (key[0] === '$')
            return;
        const { setupState, props, data } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        else if (hasOwn(data, key)) {
            return data[key];
        }
        else {
            return undefined;
        }
    },
    set({ _: instance }, key, value) {
        const { setupState, props, data } = instance;
        if (hasOwn(setupState, key)) {
            setupState[key] = value;
            return true;
        }
        else if (hasOwn(props, key)) {
            props[key] = value;
            return true;
        }
        else if (hasOwn(data, key)) {
            data[key] = value;
            return true;
        }
        else {
            return false;
        }
    }
};

function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        props: {},
        attrs: {},
        slots: {},
        ctx: {},
        data: {},
        render: null,
        proxy: {},
        setupState: {},
        isMounted: false,
    };
    instance.ctx = { _: instance };
    return instance;
}
function setupComponent(instance) {
    const { props, children } = instance.vnode;
    const { data } = instance.type;
    instance.props = props;
    instance.children = children;
    if (!isFunction(data) && data) {
        console.warn(`${data} must be call as a retrun of function`);
    }
    else if (data) {
        instance.data = data();
    }
    setupStatefulComponent(instance);
}
let currentInstance = null;
const setCurrentInstance = instance => currentInstance = instance;
const getCurrentInstance = () => currentInstance;
function setupStatefulComponent(instance) {
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        const setupContext = createSetupContext(instance);
        currentInstance = instance;
        const setupResult = setup(instance.props, setupContext);
        currentInstance = null;
        handleSetupResult(instance, setupResult);
    }
    else {
        finisheComponentSetup(instance);
    }
}
function handleSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) {
        instance.render = setupResult;
    }
    else if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
    finisheComponentSetup(instance);
}
function finisheComponentSetup(instance) {
    var _a;
    const Component = instance.type;
    if (!instance.render) {
        if (!Component.render && Component.template) {
            console.log('编译模板');
            Component.render = Component.template;
        }
        instance.render = Component.render;
    }
    console.log('完成结果后的render函数', (_a = instance === null || instance === void 0 ? void 0 : instance.render) === null || _a === void 0 ? void 0 : _a.toString());
}
function createSetupContext(instance) {
    return {
        attrs: instance.attrs,
        props: instance.props,
        slots: instance.slots,
        emit: () => { },
        expose: () => { }
    };
}

var LifecycleHooks;
(function (LifecycleHooks) {
    LifecycleHooks["BEFORE_CREATE"] = "bc";
    LifecycleHooks["CREATED"] = "c";
    LifecycleHooks["BEFORE_MOUNT"] = "bm";
    LifecycleHooks["MOUNTED"] = "m";
    LifecycleHooks["BEFORE_UPDATE"] = "bu";
    LifecycleHooks["UPDATED"] = "u";
    LifecycleHooks["BEFORE_UNMOUNT"] = "bum";
    LifecycleHooks["UNMOUNTED"] = "um";
    LifecycleHooks["DEACTIVATED"] = "da";
    LifecycleHooks["ACTIVATED"] = "a";
    LifecycleHooks["RENDER_TRIGGERED"] = "rtg";
    LifecycleHooks["RENDER_TRACKED"] = "rtc";
    LifecycleHooks["ERROR_CAPTURED"] = "ec";
    LifecycleHooks["SERVER_PREFETCH"] = "sp";
})(LifecycleHooks || (LifecycleHooks = {}));
function invokerArrayFns(fns) {
    for (let i = 0; i < fns.length; i++) {
        fns[i]();
    }
}
function injectHook(type, hook, target) {
    if (!target) {
        return console.warn('injectHook APIs can only be used in setup()');
    }
    else {
        const hooks = target[type] || (target[type] = []);
        const wrap = () => {
            setCurrentInstance(target);
            hook.call(target);
            setCurrentInstance(null);
        };
        hooks.push(wrap);
    }
}
function createHook(lifecycle) {
    return (hook, target = currentInstance) => {
        injectHook(lifecycle, hook, target);
    };
}
const onBeforeMount = createHook("bm");
const onMount = createHook("m");
const onBeforeUpdate = createHook("bu");
const onUpdated = createHook("u");

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    if (prevProps === nextProps) {
        return false;
    }
    if (!prevProps) {
        return !!nextProps;
    }
    if (!nextProps) {
        return true;
    }
    return hasPropsChanged(prevProps, nextProps);
}
function hasPropsChanged(prevProps, nextProps) {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
        return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
        const key = nextKeys[i];
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
function queueJob(job) {
    if (!queue.includes(job)) {
        queue.push(job);
        queueFlush();
    }
}
let isFlushPending = false;
function queueFlush() {
    if (!isFlushPending) {
        isFlushPending = true;
        Promise.resolve().then(flushJob);
    }
}
function flushJob() {
    isFlushPending = false;
    queue.sort((a, b) => a.id - b.id);
    for (let i = 0; i < queue.length; i++) {
        const job = queue[i];
        job();
    }
    queue.length = 0;
}

function createRenderer(rendererOptions) {
    const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, setText: hostSetText, nextSibling: hostNextSibling, setElementText: hostSetElementText, } = rendererOptions;
    const setupRenderEffect = (instance, container) => {
        instance.update = effect(function componentEffect() {
            if (!instance.isMounted) {
                const { bm, m } = instance;
                if (bm) {
                    invokerArrayFns(bm);
                }
                const proxyToUse = instance.proxy;
                const subTree = instance.subTree = instance.render.call(proxyToUse, proxyToUse);
                console.log('subTree', subTree);
                patch(null, subTree, container);
                instance.isMounted = true;
                if (m) {
                    invokerArrayFns(m);
                }
            }
            else {
                const { bu, u } = instance;
                if (bu) {
                    invokerArrayFns(bu);
                }
                const { next, vnode } = instance;
                if (next) {
                    console.log('有next', next, instance);
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const prevTree = instance.subTree;
                const proxyToUse = instance.proxy;
                const nextTree = instance.render.call(proxyToUse, proxyToUse);
                console.log('更新了,oldtree and newtree', prevTree, nextTree);
                patch(prevTree, nextTree, container);
                instance.subTree = nextTree;
                if (u) {
                    invokerArrayFns(u);
                }
            }
        }, {
            scheduler: queueJob
        });
    };
    const updateComponentPreRender = (instance, next) => {
        next.component = instance;
        instance.vnode = next;
        instance.next = null;
        instance.props = next.props;
    };
    const mountComponent = (initialVNode, container) => {
        console.log('组件初始化挂载');
        const instance = initialVNode.component = createComponentInstance(initialVNode);
        setupComponent(instance);
        setupRenderEffect(instance, container);
    };
    const patchComponent = (n1, n2, container) => {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            console.log(`组件不需要更新: ${instance}`);
            n2.component = n1.component;
            n2.el = n1.el;
            instance.vnode = n2;
        }
    };
    const processComponent = (n1, n2, container) => {
        if (n1 === null) {
            mountComponent(n2, container);
        }
        else {
            patchComponent(n1, n2);
            console.log('更新组件');
        }
    };
    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            const child = normalizeVNode(children[i]);
            patch(null, child, container);
        }
    };
    const mountElement = (vnode, container, anchor = null) => {
        const { props, shapeFlag, type, children } = vnode;
        const el = vnode.el = hostCreateElement(type);
        if (props) {
            for (const key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        if (shapeFlag & 8) {
            hostSetElementText(el, children);
        }
        else if (shapeFlag & 16) {
            mountChildren(children, el);
        }
        hostInsert(el, container, anchor);
    };
    const patchProps = (oldProps, newProps, el) => {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prev = oldProps[key];
                const next = newProps[key];
                if (prev !== next) {
                    hostPatchProp(el, key, prev, next);
                }
            }
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null);
                }
            }
        }
    };
    const unmount = (oldVNode) => {
        hostRemove(oldVNode.el);
    };
    const unmountChildren = (children) => {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            unmount(child);
        }
    };
    const patchKeyedChildren = (c1, c2, container) => {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(normalizeVNode(n1), normalizeVNode(n2), container);
            }
            else {
                break;
            }
            i++;
        }
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(normalizeVNode(n1), normalizeVNode(n2), container);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        console.log(`双端比较后=>i=${i},e1=${e1},e2=${e2}`);
        if (i > e1 && i <= e2) {
            console.log('新的多，老的少，需要挂载新的');
            const nextPos = e2 + 1;
            const anchor = nextPos < c2.length ? c2[nextPos].el : null;
            while (i <= e2) {
                patch(null, c2[i], container, anchor);
                i++;
            }
        }
        else if (i > e2 && i <= e1) {
            console.log('新的少，老的多，需要卸载旧的');
            while (i <= e1) {
                unmount(c1[i]);
                i++;
            }
        }
        else {
            console.log('乱序比较');
            let s1 = i;
            let s2 = i;
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const childVNode = c2[i];
                keyToNewIndexMap.set(childVNode.key, i);
            }
            const toBePatched = e2 - s2 + 1;
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            for (let i = s1; i <= e1; i++) {
                const oldVNode = c1[i];
                const newIndex = keyToNewIndexMap.get(oldVNode.key);
                if (newIndex === undefined) {
                    unmount(oldVNode);
                }
                else {
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(oldVNode, c2[i], container);
                }
            }
            const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const currentIndex = i + s2;
                const child = c2[currentIndex];
                const anchor = currentIndex + 1 < c2.length ? c2[currentIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, child, anchor);
                }
                else {
                    if (i !== increasingNewIndexSequence[j]) {
                        hostInsert(child.el, container, anchor);
                        console.log('move', child.el);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    };
    const patchChildren = (n1, n2, container) => {
        const c1 = n1.children;
        const c2 = n2.children;
        const prevShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        if (shapeFlag & 1024) {
            if (prevShapeFlag & 1024) {
                console.log('新的为空，老的为空,啥也不做', c1, c2);
            }
            else if (prevShapeFlag & 16) {
                unmountChildren(c1);
                console.log('新的为空，老的为数组,卸载老的数组', c1, c2);
            }
            else {
                hostSetElementText(container, '');
                console.log('新的为空，老的为文本,清空文本', c1, c2);
            }
        }
        else if (shapeFlag & 16) {
            if (prevShapeFlag & 1024) {
                mountChildren(c2, container);
                console.log('新的为数组，老的为空,挂载新的', c1, c2);
            }
            else if (prevShapeFlag & 16) {
                patchKeyedChildren(c1, c2, container);
                console.log('新的为数组，老的为数组,diff算法', c1, c2);
            }
            else {
                hostSetElementText(container, '');
                mountChildren(c2, container);
                console.log('新的为数组，老的为文本,清空文本，再挂载新的数组', c1, c2);
            }
        }
        else {
            if (prevShapeFlag & 1024) {
                hostSetElementText(container, c2);
                console.log('新的为文本，老的为空,设置文本', c1, c2);
            }
            else if (prevShapeFlag & 16) {
                unmountChildren(c1);
                hostSetElementText(container, c2);
                console.log('新的为文本，老的为数组，卸载数组', c1, c2);
            }
            else {
                if (c1 !== c2) {
                    hostSetElementText(container, c2);
                    console.log('新的为文本，老的为文本,设置文本', c1, c2);
                }
            }
        }
    };
    const patchElement = (n1, n2, container) => {
        const el = n2.el = n1.el;
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        patchProps(oldProps, newProps, el);
        patchChildren(n1, n2, el);
    };
    const processElement = (n1, n2, container, anchor) => {
        if (n1 === null) {
            mountElement(n2, container, anchor);
        }
        else {
            patchElement(n1, n2);
        }
    };
    const processText = (n1, n2, container) => {
        if (n1 === null) {
            hostInsert(n2.el = hostCreateText(n2.children), container);
        }
        else {
            if (n2.children !== n1.children) {
                hostSetElementText(container, n2.children);
            }
        }
    };
    const patch = (n1, n2, container, anchor = null) => {
        const { shapeFlag, type } = n2;
        if (n1 && !isSameVNodeType(n1, n2)) {
            anchor = hostNextSibling(n1.el);
            unmount(n1);
            n1 = null;
        }
        switch (type) {
            case TEXT:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1) {
                    console.log('patch元素', n2);
                    processElement(n1, n2, container, anchor);
                }
                else if (shapeFlag & 4) {
                    console.log('patch组件');
                    processComponent(n1, n2, container);
                }
                break;
        }
    };
    const render = (vnode, container) => {
        patch(null, vnode, container);
    };
    return {
        createApp: createAppAPI(render)
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function h(type, propsOrChildren, children) {
    const l = arguments.length;
    if (l === 2) {
        if (isObject(propsOrChildren)) {
            if (isVNode(propsOrChildren)) {
                return createVNode(type, null, [propsOrChildren]);
            }
            return createVNode(type, propsOrChildren);
        }
        else {
            return createVNode(type, null, propsOrChildren);
        }
    }
    else {
        if (l > 3) {
            children = Array.prototype.slice.call(arguments, 2);
        }
        else if (l === 3 && isVNode(children)) {
            children = [children];
        }
        return createVNode(type, propsOrChildren, children);
    }
}

const rendererOptions = extend({ patchProp }, nodeOps);
function createApp(rootComponent, rootProps = null) {
    const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps);
    const { mount } = app;
    app.mount = (containerOrSelector) => {
        const container = nodeOps.querySelector(containerOrSelector);
        container.innerHTML = '';
        mount(container);
    };
    return app;
}

export { LifecycleHooks, computed, createApp, createRenderer, effect, getCurrentInstance, h, invokerArrayFns, onBeforeMount, onBeforeUpdate, onMount, onUpdated, reactive, readonly, ref, rendererOptions, shallowReactive, toRef, toRefs };
//# sourceMappingURL=vue.esm-bundler.js.map
