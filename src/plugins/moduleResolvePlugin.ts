import type { pluginContext } from "../interface"
import { readFile } from "fs/promises"
import { existsSync, readFileSync } from "fs"
import path from "path"
export const moduleReg = /^\/@modules\//
export function moduleResolvePlugin(ctx: pluginContext) {
    const { app, root } = ctx
    app.use(async (ctx, next) => {
        if (!moduleReg.test(ctx.path)) { //当前请求路径，是否以/@modules/开头，不是则进入下一个中间件
            return next()
        }
        //将@modules替换
        const id = ctx.path.replace(moduleReg, '') //请求的路径,最后只剩下模块名称 如 vue
        //拿到真实模块的路径
        ctx.type = "js"
        const content = await readFile(moduleResolve(id, root), "utf8")
        ctx.body = content//先修改import再发出去
    })
}
function moduleResolve(id: string, root: string): string { //在当前路径下解析模块
    const modulePath: string = path.join(root, 'node_modules', id)
    if (existsSync(`${modulePath}/package.json`)) {
        const packageJson = JSON.parse(readFileSync(`${modulePath}/package.json`, "utf8"))
        return path.join(modulePath, packageJson["module"])
    } else {
        throw new Error(`Could not find module`)
    }
}