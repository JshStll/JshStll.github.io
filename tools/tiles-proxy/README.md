Tiles proxy for local testing

This is a tiny Express proxy to help testing 3D-Tiles (LoD2) from providers that don't send CORS headers. It forwards requests and rewrites tileset JSON to route subsequent tile requests through the proxy.

Usage

1. Install dependencies:

```pwsh
cd tools/tiles-proxy
npm install
```

2. Start the proxy (default port 3000):

```pwsh
npm start
```

3. In the website UI (Projects -> Cesium controls) check "Lokalen Proxy verwenden" and click "Laden" for the tileset.

Notes
- This is for local testing only. Do not expose the proxy to the public internet.
- The proxy rewrites occurrences of `sg.geodatenzentrum.de` and `tiles.basemap.de` inside JSON responses so Cesium's subsequent tile requests are routed through the proxy as well.
- If the provider responds with a server-side ServiceException (HTTP 5xx or an XML error payload), proxying won't magically fix the upstream service.
