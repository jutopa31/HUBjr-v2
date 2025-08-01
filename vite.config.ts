import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env': {
        REACT_APP_GOOGLE_CLIENT_ID: JSON.stringify(env.REACT_APP_GOOGLE_CLIENT_ID),
        REACT_APP_GOOGLE_API_KEY: JSON.stringify(env.REACT_APP_GOOGLE_API_KEY),
      }
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
