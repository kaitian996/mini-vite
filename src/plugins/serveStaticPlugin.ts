import { pluginContext } from "../interface"
import serve from "koa-static"
import path from "path"
//静态服务插件
export function serveStaticPlugin(ctx: pluginContext) {
    const { app, root } = ctx
    app.use(serve(root)) //文件
    app.use(serve(path.join(root, "public"))) //public文件
}