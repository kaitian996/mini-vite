import Koa from 'koa'
import type { pluginContext, Config } from '../interface'
import { serveStaticPlugin } from '../plugins/serveStaticPlugin'
import { moduleRewritePlugin } from '../plugins/moduleRewritePlugin'
import { moduleResolvePlugin } from '../plugins/moduleResolvePlugin'
import { serveInjectPlugin } from '../plugins/serveInjectPlugin'
import { vueResolvePlugin } from '../plugins/vueResolvePlugin'
const baseDir = process.cwd() //项目启动目录
export function createServer(config?: Config) {
    const app = new Koa()
    const context: pluginContext = { //上下文
        root: baseDir,
        app
    }
    const { plugins } = config || {}
    const resolvePlugins: Function[] = [ //先解析路径
        moduleRewritePlugin, //重写模块放在第一个，因为需要最后给到浏览器的时候，保证全部重写过了import
        moduleResolvePlugin, //解析模块插件
        vueResolvePlugin,
        serveInjectPlugin,//给html注入一些东西
        serveStaticPlugin //静态内容
    ]
    //注册用户的plugin
    if (plugins) {
        resolvePlugins.splice(resolvePlugins.length - 1, 0, ...plugins)
    }
    resolvePlugins.forEach(plugin => plugin(context))

    app.listen(3000, async () => {
        console.log("vite start at http://localhost:3000")
    })
    return app
}