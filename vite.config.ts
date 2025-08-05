import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: "assets", // Define a pasta onde os assets serão colocados
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor"; // Cria um arquivo separado para dependências externas
          }
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
});
