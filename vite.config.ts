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
            // Nama library (opsional, untuk UMD)
            name: 'Variable',
            // Format output yang diinginkan
            formats: ['umd', 'es', 'cjs', 'iife'], // 'es' untuk MJS, 'umd' untuk UMD, tambahkan 'cjs' untuk CommonJS jika perlu
            // Nama file output (tanpa ekstensi)
            fileName: (format) => `variable.${format}.js`,
        },
        rollupOptions: {
            // Pastikan hanya memproses file yang diperlukan
            input: resolve(__dirname, 'src/index.ts'),
            // external: ['@tiptap/core', '@tiptap/pm'],
            output: {
                // Atur output directory
                dir: 'dist',
                // Atur format dan nama file
                // entryFileNames: `[name].[format].js`,
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
