import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  // Vitest config
  test: {
    environment: 'jsdom',
    include: ['../tests/js/**/*.test.js'],
    globals: true,
  },
});
