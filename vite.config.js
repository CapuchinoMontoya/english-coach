import path from 'path'; // <-- Importante agregar esta línea
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    // El resolve va afuera de los plugins, directo en defineConfig
    resolve: { 
        alias: { 
            '@': path.resolve(__dirname, 'resources/js') 
        } 
    },
    esbuild: {
        jsx: 'automatic',
    },
});