import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Tangkapan layar untuk README dan kritik desain: npm run screenshots
export default defineConfig({
  ...base,
  testDir: "tests/screenshots",
  projects: [
    {
      name: "375",
      use: {
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    { name: "1440", use: { viewport: { width: 1440, height: 900 } } },
  ],
});
