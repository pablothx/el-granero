import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migraciones = await readD1Migrations("./drizzle");
  return {
    test: {
      projects: [
        {
          // Tests del Worker: corren en el runtime de Workers, contra D1 local.
          plugins: [
            cloudflareTest({
              wrangler: { configPath: "./wrangler.jsonc" },
              miniflare: { bindings: { TEST_MIGRATIONS: migraciones, TOKEN_INSTALACION: "token-de-prueba" } },
            }),
          ],
          test: {
            name: "worker",
            include: ["test/**/*.test.ts"],
            setupFiles: ["./test/aplicar-migraciones.ts", "./test/vaciar-antes-de-cada-test.ts"],
          },
        },
        {
          // Tests de componentes del cliente con lógica propia.
          plugins: [react()],
          define: { __VERSION__: JSON.stringify("test") },
          resolve: { alias: { "@": fileURLToPath(new URL("./src/client", import.meta.url)) } },
          test: {
            name: "cliente",
            environment: "jsdom",
            include: ["src/client/**/*.test.tsx"],
          },
        },
      ],
    },
  };
});
