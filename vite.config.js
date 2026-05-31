import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const mediaDirs = ['fotos', 'fotogramas', 'videos'];
const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
};

function localMediaPlugin() {
  return {
    name: 'local-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = decodeURIComponent((req.url || '').split('?')[0]);
        if (pathname === '/logo colegio.png' || pathname === '/misa/logo colegio.png') {
          const logoPath = path.join(process.cwd(), 'logo colegio.png');
          res.setHeader('Content-Type', 'image/png');
          fs.createReadStream(logoPath).pipe(res);
          return;
        }

        if (pathname === '/README.md' || pathname === '/misa/README.md') {
          const readmePath = path.join(process.cwd(), 'README.md');
          res.setHeader('Content-Type', mimeTypes['.md']);
          fs.createReadStream(readmePath).pipe(res);
          return;
        }

        const mediaDir = mediaDirs.find((dir) => pathname.includes(`/${dir}/`));
        if (!mediaDir) {
          next();
          return;
        }

        const filePath = path.join(process.cwd(), pathname.split('/').slice(2).join('/'));
        if (!fs.existsSync(filePath)) {
          next();
          return;
        }

        res.setHeader('Content-Type', mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      const distDir = path.join(process.cwd(), 'dist');
      if (!fs.existsSync(distDir)) return;

      for (const dir of mediaDirs) {
        const source = path.join(process.cwd(), dir);
        const target = path.join(distDir, dir);
        if (fs.existsSync(source)) {
          fs.cpSync(source, target, { recursive: true });
        }
      }

      const logoSource = path.join(process.cwd(), 'logo colegio.png');
      const logoTarget = path.join(distDir, 'logo colegio.png');
      if (fs.existsSync(logoSource)) {
        fs.copyFileSync(logoSource, logoTarget);
      }

      const readmeSource = path.join(process.cwd(), 'README.md');
      const readmeTarget = path.join(distDir, 'README.md');
      if (fs.existsSync(readmeSource)) {
        fs.copyFileSync(readmeSource, readmeTarget);
      }
    },
  };
}

export default defineConfig({
  base: '/misa/',
  plugins: [react(), localMediaPlugin()],
});
