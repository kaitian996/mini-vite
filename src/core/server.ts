import Koa from 'koa'
import { readFileSync } from 'fs'
import path from 'path'
const baseDir = process.cwd() //项目启动目录
export async function createVitesServer() {
    const server = new Koa()
    server.use((ctx) => {
        const { url } = ctx.request
        console.log('url', url)
        const index = readFileSync("./index.html", "utf8")
        if (url === "/") {
            ctx.type = "text/html"
            ctx.body = index
        } else if (url === "/src/main.js") {
            const filePath = path.join(baseDir, url)
            const code = readFileSync(filePath, "utf8")
            ctx.type = "application/javascript"
            ctx.body = code
        } else if (!url.endsWith('.map')) {
            const filePath = path.join(baseDir, url + '.js')
            const code = readFileSync(filePath, "utf8")
            ctx.type = "application/javascript"
            ctx.body = code
        }
    })
    server.listen(3000, async () => {
        console.log("vite start at http://localhost:3000")
    })
}