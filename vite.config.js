import { defineConfig } from 'vite';
import vitePluginString from 'vite-plugin-string';

export default defineConfig({
    plugins: [
        vitePluginString()
    ],
    server: {
        port: 3000,
        open: true // Автоматически открывать браузер при запуске
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true
    }
}); 