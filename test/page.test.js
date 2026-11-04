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

test("la charte graphique est liée dans l'ordre : polices, jetons, base, puis style.css", () => {
  const sheets = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
  assert.deepEqual(sheets, ["assets/charte/fonts.css", "assets/charte/tokens.css", "assets/charte/base.css", "style.css"]);
});

test("aucune couleur littérale dans style.css : uniquement les jetons de la charte", () => {
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
});

test("aucun emoji dans la page ni dans le script (icônes en SVG)", () => {
  const js = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  assert.doesNotMatch(html + js, /\p{Extended_Pictographic}/u);
});
