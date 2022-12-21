import Koa from 'koa'
import type { pluginContext } from '../interface'
import { serveStaticPlugin } from '../plugins/serveStaticPlugin'
import { moduleRewritePlugin } from '../plugins/moduleRewritePlugin'
import { moduleResolvePlugin } from '../plugins/moduleResolvePlugin'
const baseDir = process.cwd() //项目启动目录
export function createServer() {
    const app = new Koa()
    const context: pluginContext = { //上下文
        root: baseDir,
        app
    }
    const resolvePlugins: Function[] = [ //先解析路径
        moduleRewritePlugin, //重写模块放在第一个，因为需要最后给到浏览器的时候，保证全部重写过了import
        moduleResolvePlugin, //解析模块插件
        serveStaticPlugin //静态内容
    ]
    resolvePlugins.forEach(plugin => plugin(context))

    app.listen(3000, async () => {
        console.log("vite start at http://localhost:3000")
    })
    return app
}