function plugin1(ctx) {
    const { app } = ctx
    app.use(async (ctx, next) => {
        await next()
        console.log('读取文件', ctx.path)
    })
}
module.exports = plugin1