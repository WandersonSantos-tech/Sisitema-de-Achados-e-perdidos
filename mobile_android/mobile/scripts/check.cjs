const fs = require("node:fs"),
  path = require("node:path"),
  parser = require("@babel/parser");
let count = 0,
  failures = [];
function visit(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) visit(p);
    else if (/\.(jsx?|tsx?)$/.test(name)) {
      const source = fs.readFileSync(p, "utf8");
      try {
        const ast = parser.parse(source, {
          sourceType: "unambiguous",
          plugins: ["jsx"],
        });
        for (const n of ast.program.body) {
          if (n.type === "ImportDeclaration") {
            const spec = n.source.value;
            if (spec.startsWith(".")) {
              const base = path.resolve(path.dirname(p), spec);
              if (
                !["", ".js", ".jsx", "/index.js", "/index.jsx"].some((ext) =>
                  fs.existsSync(base + ext),
                )
              )
                throw new Error(`Import ausente: ${spec}`);
            } else require.resolve(spec, { paths: [process.cwd()] });
          }
        }
        count++;
      } catch (e) {
        failures.push(`${p}: ${e.message}`);
      }
    }
  }
}
visit("src");
for (const p of ["App.js", "index.js"]) {
  parser.parse(fs.readFileSync(p, "utf8"), {
    sourceType: "module",
    plugins: ["jsx"],
  });
  count++;
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`${count} arquivos: sintaxe e imports resolvidos.`);
