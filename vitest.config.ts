import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Os testes de integração compartilham o mesmo banco: rodam um arquivo por vez.
    fileParallelism: false,
  },
});
