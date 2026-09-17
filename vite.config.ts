import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

let buildCommit = 'Local';

try {
    buildCommit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
} catch {
    // ignore when git is not available
}

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(packageJson.version),
        __APP_COMMIT__: JSON.stringify(buildCommit),
    },
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
