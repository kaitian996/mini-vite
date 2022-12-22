import { reactive } from "./vue.esm-bundler.js"
import { createApp, h, ref } from "vue"
import App2 from "./App.vue"
const Admin = {
    setup(props, context) {
        console.log('子组件的props', props);
        return function a(proxy) {
            console.log('this', this);
            console.log('proxy', proxy)
            return h('p', { key: '1' }, [String(proxy.state)])
        }
    }
}
const App = {
    setup(props, context) {
        const state = ref(true)
        const fn = () => {
            state.value = !state.value
        }
        return () => {
            return state.value ?
                h('div', { style: { color: 'red' }, onClick: fn },
                    [
                        h('p', { key: '1' }, '1'),
                        h('p', { key: '2' }, '2'),
                        h('p', { key: '3' }, '3'),
                        h('p', { key: '4' }, '4'),
                        h('p', { key: '5' }, '5'),
                        h('p', { key: '6' }, '6'),
                        h('p', { key: '7' }, '7'),
                        h('p', { key: '8' }, '8'),
                        h(Admin, { state: state.value }),
                    ]) :
                h('div', { style: { color: 'blue' }, onClick: fn },
                    [
                        h('p', { key: '1' }, '1'),
                        h('p', { key: '2' }, '2'),
                        h('p', { key: '6' }, '6'),
                        h('p', { key: '5' }, '5'),
                        h('p', { key: '3' }, '3'),
                        h('p', { key: '4' }, '4'),
                        h('p', { key: '7' }, '7'),
                        h('p', { key: '8' }, '8'),
                        h(Admin, { state: state.value }),
                    ])
        }
    }
}
createApp(App2).mount('#app')