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

// Copy template files to output directory
function copyTemplateFiles() {
  const outDir = "out";

  // Create dialog and webview directories in output
  const dialogOutDir = path.join(outDir, "dialog");
  const webviewOutDir = path.join(outDir, "webview");

  if (!fs.existsSync(dialogOutDir)) {
    fs.mkdirSync(dialogOutDir, { recursive: true });
  }
  if (!fs.existsSync(webviewOutDir)) {
    fs.mkdirSync(webviewOutDir, { recursive: true });
  }

  // Copy dialog templates
  const dialogFiles = ["setup.html", "setup.css", "setup.js"];
  for (const file of dialogFiles) {
    const srcPath = path.join("src", "dialog", file);
    const destPath = path.join(dialogOutDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied dialog/${file} to out/dialog/`);
    }
  }

  // Copy webview templates
  const webviewFiles = ["preview.html", "preview.css", "preview.js"];
  for (const file of webviewFiles) {
    const srcPath = path.join("src", "webview", file);
    const destPath = path.join(webviewOutDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied webview/${file} to out/webview/`);
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

  // Copy WASM and template files (needed for both watch and build modes)
  copyWasmFiles();
  copyTemplateFiles();

  if (watch) {
    // Watch for template file changes
    const templateDirs = ["src/dialog", "src/webview"];

    templateDirs.forEach((dir) => {
      fs.watch(dir, { recursive: true }, (_eventType, filename) => {
        if (filename) {
          console.log(`Template file changed: ${filename}`);
          copyTemplateFiles();
        }
      });
    });

    await ctx.watch();
    // This message is matched by the background problem matcher to signal build complete
    console.log("Watching for changes...");
  } else {
    await ctx.rebuild();
    await ctx.dispose();

    // Get file size
    const stats = fs.statSync("out/extension.js");
    console.log(`Bundle size: ${(stats.size / 1024).toFixed(2)} KB`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
