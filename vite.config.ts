import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Завантаження змінних середовища з .env файлів
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      svgr({
        svgrOptions: {
          exportType: "named",
          ref: true,
          svgo: true,
          titleProp: true,
        },
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "masked-icon.svg",
        ],
        manifest: {
          name: "ToAgro - Агротехніка та запчастини",
          short_name: "ToAgro",
          description:
            "Маркетплейс сільськогосподарської техніки та запчастин в Україні",
          theme_color: "#059669",
          background_color: "#ffffff",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@components": resolve(__dirname, "./src/components"),
        "@pages": resolve(__dirname, "./src/pages"),
        "@hooks": resolve(__dirname, "./src/hooks"),
        "@store": resolve(__dirname, "./src/store"),
        "@api": resolve(__dirname, "./src/api"),
        "@utils": resolve(__dirname, "./src/utils"),
        "@types": resolve(__dirname, "./src/types"),
        "@assets": resolve(__dirname, "./src/assets"),
        "@styles": resolve(__dirname, "./src/styles"),
        "@context": resolve(__dirname, "./src/context"),
        "@routes": resolve(__dirname, "./src/routes"),
      },
    },
    server: {
      port: parseInt(env.VITE_SERVER_PORT || "3000"),
      open: true,
      // Опції проксі, якщо потрібно комунікувати з API на іншому порті під час розробки
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "build",
      sourcemap: true,
      // Додаткові налаштування для production build
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "redux-vendor": ["@reduxjs/toolkit", "react-redux"],
            "ui-vendor": [
              "@fontsource/inter",
              "lucide-react",
              "react-toastify",
            ],
            "form-vendor": ["react-hook-form", "zod", "@hookform/resolvers"],
          },
        },
      },
      // Оптимізації
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    css: {
      postcss: "./postcss.config.js",
      // Модулі CSS, якщо потрібні
      modules: {
        scopeBehaviour: "local",
        localsConvention: "camelCase",
      },
    },
    optimizeDeps: {
      include: ["@fontsource/inter", "react-toastify", "react-router-dom"],
    },
    // Налаштування для тестів
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      coverage: {
        reporter: ["text", "json", "html"],
        exclude: ["node_modules/", "src/test/"],
      },
      include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
    },
    // Налаштування для production
    esbuild: {
      logOverride: { "this-is-undefined-in-esm": "silent" },
    },
  };
});
