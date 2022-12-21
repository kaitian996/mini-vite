import type Koa from 'koa'
export type pluginContext = {
    root: string;
    app: Koa<Koa.DefaultState, Koa.DefaultContext>;
    config?:Config
}
export type Config = {
    plugins: Function[]
}