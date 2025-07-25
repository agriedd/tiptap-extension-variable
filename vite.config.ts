import {defineConfig} from 'vite'
import {resolve} from 'path';
import react from '@vitejs/plugin-react-oxc'
// @ts-ignore unknown issue
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json';
import inspect from 'vite-plugin-inspect';
import {visualizer} from "rollup-plugin-visualizer";
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(), tailwindcss(), visualizer(),
        inspect({
            build: true,
            outputDir: '.vite-inspect',
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'Variable',
            formats: ['es', 'umd'],
            fileName: (format) => `variable.${format}.js`,
        },
        sourcemap: true,
        rollupOptions: {
            input: resolve(__dirname, 'src/index.ts'),
            output: {
                dir: 'dist',
                globals: {
                    '@tiptap/core': '@tiptap/core',
                    '@tiptap/pm': '@tiptap/pm',
                    'prosemirror-model': 'prosemirror-model',
                    'prosemirror-state': 'prosemirror-state',
                    'prosemirror-view': 'prosemirror-view',
                    'prosemirror-transform': 'prosemirror-transform',
                    '@tiptap/pm/model': '@tiptap/pm/model',
                    '@tiptap/pm/state': '@tiptap/pm/state',
                    '@tiptap/pm/view': '@tiptap/pm/view',
                },
            },
            external: [
                ...Object.keys(packageJson.peerDependencies || {}),
                'prosemirror-model',
                'prosemirror-state',
                'prosemirror-view',
                'prosemirror-transform',
                '@tiptap/core',
                '@tiptap/pm',
                '@tiptap/pm/model',
                '@tiptap/pm/state',
                '@tiptap/pm/view',
            ],
        },
        emptyOutDir: true,
        minify: 'oxc',
    },
    experimental: {
        enableNativePlugin: true,
    },
})
