import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

function componentTagger() {
  return {
    name: "component-tagger",
    transform(code: string, id: string) {
      if (id.includes("node_modules")) return;
      
      const isJsx = /\.[jt]sx?$/.test(id);
      if (!isJsx) return;

      const componentName = id.split("/").pop()?.split(".")[0];
      const injection = `\nif (typeof window !== "undefined") window.__COMPONENT__ = "${componentName}";`;
      
      return {
        code: code + injection,
        map: null,
      };
    },
  };
}

