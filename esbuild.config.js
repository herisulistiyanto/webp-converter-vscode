const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// Clean out directory except styles
function cleanOutDir() {
  const outDir = "out";
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
    return;
  }

  const files = fs.readdirSync(outDir);
  for (const file of files) {
    const filePath = path.join(outDir, file);
    if (file !== "styles" && fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
    }
  }
}

// Copy WASM files to output directory
function copyWasmFiles() {
  const wasmDir = path.join("node_modules", "webp-wasm");
  const outDir = "out";

  // Copy .wasm files and their loader .js files
  const filesToCopy = [
    "webp_node_dec.wasm",
    "webp_node_enc.wasm",
    "webp_node_dec.js",
    "webp_node_enc.js",
  ];

  for (const file of filesToCopy) {
    const srcPath = path.join(wasmDir, file);
    const destPath = path.join(outDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to out/`);
    }
  }
}
async function main() {
  // Clean old compiled files
  cleanOutDir();

  console.log(`Building in ${production ? "PRODUCTION" : "development"} mode...`);

  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    minifyWhitespace: production,
    minifyIdentifiers: production,
    minifySyntax: production,
    treeShaking: true,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    target: "node18",
    outfile: "out/extension.js",
    external: ["vscode"], // Only vscode is external - WASM loaders are loaded dynamically
    logLevel: "info",
    legalComments: "none",
    drop: production ? ["debugger"] : [],
    metafile: true,
    keepNames: false,
  });

  if (watch) {
    await ctx.watch();
    console.log("Watching...");
  } else {
    const result = await ctx.rebuild();
    await ctx.dispose();

    // Copy WASM files
    copyWasmFiles();

    // Get file size
    const stats = fs.statSync("out/extension.js");
    console.log(`\nBundle size: ${(stats.size / 1024).toFixed(2)} KB`);

    if (result.metafile) {
      // Log bundle analysis
      console.log("\nBundle analysis (top 10 files):");
      const inputs = Object.entries(result.metafile.inputs)
        .map(([name, data]) => ({ name, size: data.bytes }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);

      for (const input of inputs) {
        console.log(`  ${(input.size / 1024).toFixed(2).padStart(8)} KB  ${input.name}`);
      }
    }

    console.log(`\nFinal output size: ${(stats.size / 1024).toFixed(2)} KB`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
