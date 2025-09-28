import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Include specific polyfills for blockchain libraries
      include: [
        'buffer', 
        'crypto', 
        'stream', 
        'util', 
        'process', 
        'os', 
        'path',
        'fs',
        'events',
        'url'
      ],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    // Custom plugin to handle @hashgraph/proto imports
    {
      name: 'hashgraph-proto-fix',
      transform(code, id) {
        if (id.includes('@hashgraph/sdk') && code.includes('from "@hashgraph/proto"')) {
          return code.replace(
            /import\s*\{\s*proto\s*\}\s*from\s*["']@hashgraph\/proto["'];?/g,
            'import * as protoModule from "@hashgraph/proto";\nconst { proto } = protoModule;'
          );
        }
        return null;
      }
    }
  ],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add aliases for better module resolution
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util',
      buffer: 'buffer',
      // Redirect problematic forge-light modules
      'forge-light/lib/pem.js': path.resolve(__dirname, './src/stubs/pem.js'),
      'forge-light/lib/pem': path.resolve(__dirname, './src/stubs/pem.js'),
      'forge-light': path.resolve(__dirname, './src/stubs/pem.js'),
      'node-forge': path.resolve(__dirname, './src/stubs/pem.js'),
      // Fix Hashgraph SDK browser modules
      '@hashgraph/cryptography/src/encoding/pem.js': path.resolve(__dirname, './src/stubs/pem.js'),
      '@hashgraph/sdk/src/encoding/hex.browser.js': path.resolve(__dirname, './src/stubs/browser-modules.js'),
      '@hashgraph/sdk/src/cryptography/sha384.browser.js': path.resolve(__dirname, './src/stubs/browser-modules.js'),
      '@hashgraph/cryptography/src/encoding/utf8.browser.js': path.resolve(__dirname, './src/stubs/browser-modules.js'),
      'asn1.js/lib/asn1/decoders/pem.js': path.resolve(__dirname, './src/stubs/pem.js'),
    },
  },
  server: {
    port: 3000,
  },
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: (id) => {
        // Only externalize TypeScript definition files
        if (id.includes('.d.ts')) {
          return true;
        }
        return false;
      },
    },
    commonjsOptions: {
      include: [/@hashgraph/, /tweetnacl/, /node_modules/],
      transformMixedEsModules: true,
      defaultIsModuleExports: 'auto',
    },
  },
  optimizeDeps: {
    include: [
      '@hashgraph/proto',
      '@hashgraph/sdk',
      '@hashgraph/cryptography',
      'tweetnacl',
      'buffer',
      'crypto-browserify',
      'stream-browserify',
      'util'
    ],
    exclude: [
      'forge-light',
      'forge-light/lib/pem'
    ],
    force: true,
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [{
        name: 'resolve-hedera-issues',
        setup(build) {
          // Handle forge-light modules - redirect to stub
          build.onResolve({ filter: /forge-light/ }, (args) => {
            return { path: path.resolve(__dirname, './src/stubs/pem.js') };
          });

          // Handle node-forge - redirect to stub
          build.onResolve({ filter: /node-forge/ }, (args) => {
            return { path: path.resolve(__dirname, './src/stubs/pem.js') };
          });

          // Handle Hedera SDK browser modules - redirect to browser-modules stub
          build.onResolve({ filter: /@hashgraph\/(sdk|cryptography).*\.(browser\.js|pem\.js)$/ }, (args) => {
            if (args.path.includes('pem')) {
              return { path: path.resolve(__dirname, './src/stubs/pem.js') };
            }
            return { path: path.resolve(__dirname, './src/stubs/browser-modules.js') };
          });

          // Handle ASN1 PEM modules
          build.onResolve({ filter: /asn1\.js.*pem\.js$/ }, (args) => {
            return { path: path.resolve(__dirname, './src/stubs/pem.js') };
          });
        },
      }],
    },
  },
})