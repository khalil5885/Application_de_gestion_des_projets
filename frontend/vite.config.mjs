import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import autoprefixer from 'autoprefixer'

export default defineConfig(() => {
  return {
    base: './',
    build: {
      outDir: 'build',
    },
    css: {
      postcss: {
        plugins: [autoprefixer({})],
      },
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      // force: true  ← removed
      include: [
        '@coreui/react',
        '@coreui/icons-react',
        '@coreui/icons',
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
      ],
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
    },
    plugins: [react()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, 'src') },
        { find: 'src/', replacement: `${path.resolve(__dirname, 'src')}/` },
      ],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://laravel:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
    },
  }
})