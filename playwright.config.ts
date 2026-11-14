import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// E2E berjalan pada build produksi dengan penyimpanan memori dan tanpa kunci AI,
// sehingga sekaligus menguji bahwa alur tetap jalan saat AI tidak tersedia.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      GROQ_API_KEY: "",
      GEMINI_API_KEY: "",
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      SUPABASE_ANON_KEY: "",
      IP_HASH_SALT: "e2e",
    },
  },
});
