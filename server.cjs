'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8',
};

const server = http.createServer((request, response) => {
  const fail = (status, message) => {
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(message);
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') return fail(405, 'Method not allowed');
  let requested;
  try {
    requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/\\/g, '/');
  } catch (_) {
    return fail(400, 'Invalid URL');
  }
  if (requested.includes('\0') || requested.includes(':') || requested.split('/').some(part => part.startsWith('.'))) return fail(403, 'Forbidden');
  let filename = path.resolve(root, '.' + requested);
  if (filename !== root && !filename.startsWith(root + path.sep)) return fail(403, 'Forbidden');
  fs.stat(filename, (error, stat) => {
    if (error) return fail(404, 'Not found');
    if (stat.isDirectory()) filename = path.join(filename, 'index.html');
    fs.realpath(filename, (realError, resolved) => {
      if (realError) return fail(404, 'Not found');
      if (!resolved.startsWith(root + path.sep)) return fail(403, 'Forbidden');
      fs.readFile(resolved, (readError, content) => {
        if (readError) return fail(404, 'Not found');
        response.writeHead(200, {
          'Content-Type': types[path.extname(resolved).toLowerCase()] || 'application/octet-stream',
          'Content-Length': content.length,
          'Cache-Control': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        });
        response.end(request.method === 'HEAD' ? undefined : content);
      });
    });
  });
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is busy. Set PORT to another number.` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`圣犬帕拉 · 微光远征: http://127.0.0.1:${port}`));
