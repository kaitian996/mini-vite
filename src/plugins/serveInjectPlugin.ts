import { pluginContext } from "../interface"
import { readBody } from "../utils"
//给模板注入一些东西，如hmr、process变量
export function serveInjectPlugin(ctx: pluginContext) {
    const process = `
    <script>
    var process={
        env:{
            NODE_ENV:'development'
        }
    }
    </script>
    `
    const { app } = ctx
    app.use(async (ctx, next) => {
        await next()
        if (ctx.response.is("html")) {
            const html = await readBody(ctx.body)
            ctx.body = html.replace(/<head>/, `${process}`)
        }
    })
}