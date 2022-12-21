import { defineConfig } from 'tsup'

export default defineConfig({
  outExtension({ format }) {
    return {
      js: `.${format}.js`,
    }
  },
  entry: ['src/index.ts'],
  format: ["cjs", "esm"],
  splitting: false,
  sourcemap: true,
  clean: true,
})