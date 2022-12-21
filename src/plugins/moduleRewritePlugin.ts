import type { pluginContext } from "../interface"
import { readBody } from "../utils"
import { parse } from "es-module-lexer" //解析import语法
import MagicString from "magic-string" //字符串具有不变性
//重写请求路径插件
export function moduleRewritePlugin(ctx: pluginContext) {
    const { app } = ctx
    app.use(async (ctx, next) => {
        await next() //先读完静态文件，此时静态文件在ctx.body上，拿到的是流对象
        console.log("请求路径", ctx.path)
        //读取流中的代码
        if (ctx.body && ctx.response.is("js")) {
            console.log("改写")
            const content = await readBody(ctx.body) //拿到结果
            const result = rewriteImport(content) //重写import
            ctx.body = result
        }
    })
}
export function rewriteImport(source: string) {
    const imports = parse(source)[0] //静态导入
    const magicString = new MagicString(source)
    //如果有import语法，看是否需要重写
    if (imports.length) {
        for (let i = 0; i < imports.length; i++) {
            const { s, e } = imports[i]
            let id = source.substring(s, e)
            if (/^[^\/\.]/.test(id)) { //不是. 或./开头的，需要重写
                id = `/@modules/${id}`
                magicString.overwrite(s, e, id)
            } else if (!/^.js/g.test(id)) { //不以.js结尾
                id = `${id}.js`
                magicString.overwrite(s, e, id)
            }
        }
    }
    return magicString.toString()
}