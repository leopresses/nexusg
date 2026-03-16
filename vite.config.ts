import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Build define overrides only when values are actually present
  const env = loadEnv(mode, process.cwd(), "");
  const defineEnv: Record<string, string> = {};

  if (env.VITE_SUPABASE_PROJECT_ID) {
    defineEnv["import.meta.env.VITE_SUPABASE_PROJECT_ID"] = JSON.stringify(env.VITE_SUPABASE_PROJECT_ID);
  }
  if (env.VITE_SUPABASE_URL || env.VITE_SUPABASE_PROJECT_ID) {
    const url = env.VITE_SUPABASE_URL || `https://${env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
    defineEnv["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(url);
  }
  if (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY) {
    defineEnv["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(
      env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY
    );
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    define: defineEnv,
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
