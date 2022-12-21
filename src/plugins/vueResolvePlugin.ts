import { pluginContext } from "../interface"
import { parse, compileTemplate, compileScript } from "@vue/compiler-sfc"
import { readBody } from "../utils"
const defaultExportRE = /((?:^|\n|;)\s*)export default/
export function vueResolvePlugin(ctx: pluginContext) {
    const { app, root } = ctx
    app.use(async (ctx, next) => {
        await next()
        //编译vue文件
        if (ctx.path.endsWith(".vue")) {
            const sfc = await readBody(ctx.body)
            const { descriptor } = parse(sfc)
            if (!ctx.query.type) { //App.vue,先给component对象，再要一个render函数
                let code = ''
                if (descriptor.scriptSetup) {
                    const content = descriptor.scriptSetup.content //导出的对象 export df {}
                    const replaced = content.replace(defaultExportRE, '$1const __script=')
                    code += replaced
                }
                if (descriptor.script) {
                    const content = descriptor.script.content //导出的对象 export df {}
                    const replaced = content.replace(defaultExportRE, '$1const __script=')
                    code += replaced
                }
                if (descriptor.template) {
                    const templateRequest = ctx.path + '?type=template'
                    code += `\nimport {render as __render} from ${JSON.stringify(templateRequest)}`
                    code += `\n__script.render=__render`
                }
                ctx.type = "js"
                code += `\nexport default __script`
                ctx.body = code
            } else if (ctx.query.type === "template") {
                ctx.type = "js"
                const content = descriptor?.template?.content || ' '
                const { code } = compileTemplate({
                    source: content,
                    filename: "_",
                    id: "_"
                })
                ctx.body = code
            }
        }


    })
}