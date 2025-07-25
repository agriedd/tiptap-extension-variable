import {defineConfig} from 'vite'
import { resolve } from 'path';
import react from '@vitejs/plugin-react'
// @ts-ignore unknown issue
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json';
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(), tailwindcss()
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'Variable',
            formats: ['umd', 'es', 'cjs', 'iife'],
            fileName: (format) => `variable.${format}.js`,
        },
        rollupOptions: {
            input: resolve(__dirname, 'src/index.ts'),
            output: {
                dir: 'dist',
                globals: {
                    '@tiptap/core': 'tiptapCore',
                    '@tiptap/pm': 'tiptapPm',
                },
            },
            external: Object.keys(packageJson.peerDependencies || {}),
        },
        emptyOutDir: true,
    },
    experimental: {
        enableNativePlugin: true,
    },
})
