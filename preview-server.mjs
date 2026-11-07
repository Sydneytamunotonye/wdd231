// Temporary local preview server for verification only.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(root, urlPath === "/" ? "index.html" : urlPath);
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("not found: " + file);
        return;
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
      });
      res.end(data);
    });
  })
  .listen(8321, () => console.log("preview on http://localhost:8321"));
