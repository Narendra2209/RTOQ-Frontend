import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The page runs on :3435 and every /api call goes through to the Flask backend on
// :2324. Both ports can be changed in backend/.env (BACKEND_PORT, FRONTEND_PORT), the
// same file the backend reads. `npm run build` writes frontend/dist, which
// `npm run preview` (and Flask) serve.
const backendDir = fileURLToPath(new URL('../backend', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, backendDir, ''), ...process.env };
  const backendPort = Number(env.BACKEND_PORT || 2324);
  const frontendPort = Number(env.FRONTEND_PORT || 3435);
  const page = {
    host: '127.0.0.1',
    port: frontendPort,
    strictPort: true,
    proxy: { '/api': `http://127.0.0.1:${backendPort}` },
  };

  return {
    plugins: [react()],
    server: page,
    preview: page,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
