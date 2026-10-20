import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Router } from "express";
import { marked, Renderer } from "marked";

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

const renderer = new Renderer();
renderer.heading = ({ text, depth }) => {
  const id = slug(text);
  return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true"></a>${text}</h${depth}>`;
};

marked.use({ renderer });

const router = Router();

const GITHUB_CSS = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans", Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: #1f2328;
      background: #fff;
      padding: 32px;
    }
    .markdown-body {
      max-width: 980px;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; padding-bottom: 0.3em; border-bottom: 1px solid #d1d9e0; }
    h2 { font-size: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid #d1d9e0; }
    h3 { font-size: 1.25em; }
    p { margin-top: 0; margin-bottom: 16px; }
    a { color: #0969da; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul, ol { padding-left: 2em; margin-top: 0; margin-bottom: 16px; }
    li { margin-bottom: 4px; }
    li + li { margin-top: 0.25em; }
    code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background: #eff1f3;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
        "Liberation Mono", monospace;
    }
    pre {
      margin-top: 0;
      margin-bottom: 16px;
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background: #f6f8fa;
      border-radius: 6px;
    }
    pre code {
      padding: 0;
      margin: 0;
      background: transparent;
      border-radius: 0;
      font-size: 100%;
    }
    table {
      border-collapse: collapse;
      border-spacing: 0;
      width: auto;
      margin-top: 0;
      margin-bottom: 16px;
      display: block;
      overflow: auto;
    }
    table th, table td {
      padding: 6px 13px;
      border: 1px solid #d1d9e0;
    }
    table th {
      font-weight: 600;
      background: #f6f8fa;
    }
    table tr:nth-child(2n) { background: #f6f8fa; }
    hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #d1d9e0;
      border: 0;
    }
    blockquote {
      margin: 0 0 16px 0;
      padding: 0 1em;
      color: #636c76;
      border-left: 0.25em solid #d1d9e0;
    }
    strong { font-weight: 600; }
    img { max-width: 100%; }
    html { scroll-behavior: smooth; }
    .anchor { float: left; padding-right: 4px; margin-left: -20px; line-height: 1; }
    .anchor::before { content: "#"; }
    h1:hover .anchor, h2:hover .anchor, h3:hover .anchor,
    h4:hover .anchor, h5:hover .anchor, h6:hover .anchor { text-decoration: none; }
  </style>
`;

router.get("/docs", (_req, res) => {
  try {
    const readmePath = resolve(process.cwd(), "API.md");
    const md = readFileSync(readmePath, "utf-8");
    const html = marked.parse(md) as string;

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API Documentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;600&display=swap" rel="stylesheet" />
  ${GITHUB_CSS}
</head>
<body>
  <article class="markdown-body">
    ${html}
  </article>
</body>
</html>`);
  } catch {
    res.status(500).send("Failed to load documentation.");
  }
});

export { router as docsRouter };
