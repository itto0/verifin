import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const aiUpstreamBase = (process.env.AI_UPSTREAM_URL || 'https://or.flux.id/v1').replace(/\/+$/, '');

// Parse JSON and raw bodies for AI proxy requests
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ limit: '50mb', type: '*/*' }));

// Reverse proxy for AI inference requests (/api/ai/* -> https://or.flux.id/v1/*)
app.all('/api/ai/*', async (req, res) => {
  const targetSubpath = req.url.replace(/^\/api\/ai/, '') || '';
  const targetUrl = `${aiUpstreamBase}${targetSubpath}`;

  try {
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    delete headers['content-length'];
    // Force upstream to return plain uncompressed text to avoid Brotli/gzip corruption through proxies
    headers['accept-encoding'] = 'identity';

    const fetchOptions = {
      method: req.method,
      headers: {
        ...headers,
        host: new URL(aiUpstreamBase).host,
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        fetchOptions.body = JSON.stringify(req.body);
        fetchOptions.headers['content-type'] = 'application/json';
      } else if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        fetchOptions.body = req.body;
      }
    }

    const upstreamResponse = await fetch(targetUrl, fetchOptions);
    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['content-encoding', 'transfer-encoding', 'connection', 'content-length'].includes(lowerKey)) {
        res.setHeader(key, value);
      }
    });

    const responseText = await upstreamResponse.text();
    res.send(responseText);
  } catch (error) {
    console.error(`AI Proxy error forwarding to ${targetUrl}:`, error);
    res.status(502).json({
      error: 'AI_GATEWAY_PROXY_ERROR',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Serve static compiled assets
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));

// SPA fallback: any other route serves index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`VeriFin Production Server running on http://0.0.0.0:${port}`);
  console.log(`Serving static assets from ${distDir}`);
  console.log(`Proxying /api/ai to ${aiUpstreamBase}`);
});
