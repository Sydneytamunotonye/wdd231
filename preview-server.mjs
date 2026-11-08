import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".md": "text/markdown; charset=utf-8",
};

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  let path = normalize(decodeURIComponent(url.pathname));
  if (path === "/" || path.endsWith("/")) path = path + "index.html";

  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, {
      "Content-Type": types[extname(path)] ?? "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    const msg = Buffer.from("not found: " + path);
    res.writeHead(404, { "Content-Type": "text/plain", "Content-Length": msg.length });
    res.end(msg);
  }
}).listen(8321, () => console.log("http://localhost:8321/"));
