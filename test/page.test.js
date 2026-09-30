import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("aucun script, style ou gestionnaire en ligne (compatible avec une CSP stricte)", () => {
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, "script en ligne");
  assert.doesNotMatch(html, /<style/i, "bloc style");
  assert.doesNotMatch(html, /\sstyle\s*=/i, "attribut style");
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i, "gestionnaire en ligne");
});

test("le zoom reste autorisé (WCAG 1.4.4)", () => {
  const viewport = html.match(/<meta name="viewport" content="([^"]+)"/)?.[1] ?? "";
  assert.doesNotMatch(viewport, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/);
});

test("chemins relatifs : l'appli fonctionne dans un sous-dossier", () => {
  assert.match(html, /<link rel="stylesheet" href="style\.css">/);
  assert.match(html, /<script type="module" src="js\/app\.js"><\/script>/);
});
