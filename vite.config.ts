import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }, plugins: [react(), tailwindcss()], build: { rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'vendor-react', test: /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\// }, { name: 'vendor-supabase', test: /node_modules\/@supabase\// }] } } } }, test: { environment: 'jsdom', setupFiles: ['./tests/unit/setup.ts'], include: ['tests/unit/**/*.test.{ts,tsx}'], restoreMocks: true } });
