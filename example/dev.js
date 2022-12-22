const { createServer } = require('../dist/index.cjs')
const viteConfig = require('./vite.config')
createServer(viteConfig)