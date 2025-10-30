const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Basic CORS for testing
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Helper to determine if content is JSON-like
function isLikelyJson(ct) {
  if (!ct) return false;
  return ct.indexOf('application/json') !== -1 || ct.indexOf('application/vnd') !== -1 || ct.indexOf('text/json') !== -1 || ct.indexOf('+json') !== -1;
}

// Known host we rewrite inside tileset JSON so subsequent tile URLs also go through the proxy
const KNOWN_HOSTS = ['https://sg.geodatenzentrum.de', 'http://sg.geodatenzentrum.de', 'https://tiles.basemap.de', 'http://tiles.basemap.de'];

app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url query parameter.');
  try {
    const upstream = await fetch(url, { method: 'GET' });
    // Forward status
    res.status(upstream.status);
    // Forward headers (but ensure CORS)
    upstream.headers.forEach((v, k) => {
      // Avoid overriding CORS header
      if (k.toLowerCase() === 'access-control-allow-origin') return;
      res.setHeader(k, v);
    });
    res.setHeader('Access-Control-Allow-Origin', '*');

    const contentType = upstream.headers.get('content-type') || '';
    const buf = await upstream.buffer();

    if (isLikelyJson(contentType)) {
      // Rewrite known hosts inside JSON so subsequent tile requests are routed through the proxy
      let text = buf.toString('utf8');
      KNOWN_HOSTS.forEach(h => {
        if (text.indexOf(h) !== -1) {
          // Replace e.g. https://sg.geodatenzentrum.de/path -> /proxy?url=https://sg.geodatenzentrum.de/path
          text = text.split(h).join(`${req.protocol}://${req.get('host')}/proxy?url=${h}`);
        }
      });
      // Send rewritten JSON
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(text);
    }

    // Non-JSON: stream binary body
    // Ensure content-type remains
    if (contentType) res.setHeader('Content-Type', contentType);
    res.send(buf);
  } catch (err) {
    console.error('Proxy error fetching', url, err && err.stack || err);
    res.status(502).send('Proxy fetch error: ' + String(err));
  }
});

app.listen(PORT, () => console.log(`Tiles proxy listening on http://localhost:${PORT}/proxy`));
