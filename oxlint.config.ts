import { defineConfig, presets } from './src/bun.ts'

export default defineConfig({
    extends: [presets.base, presets.vitest],
    ignorePatterns: ['dist/'],
})
