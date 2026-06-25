import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: './',
  plugins: [react(), cloudflare()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        knowledge: resolve(__dirname, 'knowledge.html'),
        tools: resolve(__dirname, 'tools.html'),
        cases: resolve(__dirname, 'cases.html'),
        community: resolve(__dirname, 'community.html')
      }
    }
  }
});