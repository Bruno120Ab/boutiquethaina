import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 8080
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true, // permite rodar PWA em modo dev (apenas para testes)
      },
      includeAssets: ["icon.jpeg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "ERP Completo",
        short_name: "ERP",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/icon-192.png", // ✅ raiz pública
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png", // ✅ raiz pública
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512.png", // recomendado adicionar "maskable"
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
