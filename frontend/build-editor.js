// Script de build pour bundler CodeMirror en un seul fichier local
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['editor-src.js'],
  bundle: true,
  outfile: 'editor-bundle.js',
  format: 'iife',
  globalName: 'LeyoEditorModule',
  platform: 'browser',
  minify: false,
  sourcemap: false,
}).then(() => {
  console.log('✅ CodeMirror bundlé dans editor-bundle.js');
}).catch(() => process.exit(1));