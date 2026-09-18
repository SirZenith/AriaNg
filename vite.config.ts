import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 9000,
    },
    build: {
        chunkSizeWarningLimit: 1024,
        rollupOptions: {
            output: {
                manualChunks(id: string) {
                    if (
                        id.includes('node_modules/recharts') ||
                        id.includes('node_modules/d3-') ||
                        id.includes('node_modules/victory-vendor') ||
                        id.includes('node_modules/react-smooth')
                    ) {
                        return 'charts';
                    }

                    return undefined;
                },
            },
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
});
