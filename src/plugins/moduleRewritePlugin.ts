import type { pluginContext } from "../interface"
import { readBody } from "../utils"
import { parse } from "es-module-lexer" //解析import语法
import MagicString from "magic-string" //字符串具有不变性
import picocolors from "picocolors"
//重写请求路径插件
export function moduleRewritePlugin(ctx: pluginContext) {
    const { app } = ctx
    app.use(async (ctx, next) => {
        await next() //先读完静态文件，此时静态文件在ctx.body上，拿到的是流对象
        console.log(`${picocolors.red('request asserts')} => ${picocolors.green(`${ctx.path}`)} status: ${picocolors.yellow(`${ctx.status}`)}`)
        //读取流中的代码
        if (ctx.body && ctx.response.is("js")) {
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
            if (/^[^\/\.]/.test(id)) { //模块 vue react 不是/ 或者./开头
                id = `/@modules/${id}`
                magicString.overwrite(s, e, id)
            }
            //TODO:如何判断是以./开头 没有.*结尾？
            // else {//是以/ 或./开头
            //     if (/^.\//.test(id)) { //以./开头
            //         if (!id.endsWith(".js")) {//不以.*结尾，需要补充.js
            //             id = `${id}.js`
            //             magicString.overwrite(s, e, id)
            //         }
            //     }
            // }
        }
    }
    return magicString.toString()
}