import aiResults from "../../../data/demo/ai-results.json";

// Hasil AI sungguhan untuk data contoh, dibuat oleh scripts/generate-demo-ai.ts.
// Kosong berarti skrip belum dijalankan: laporan contoh tampil "belum dirapikan AI".

export type DemoAiResult = {
  fingerprint: string;
  provider: string;
  model: string;
  promptVersion?: string;
  generatedAt: string;
  output: unknown;
};

export function loadDemoAiResults(): Record<string, DemoAiResult> {
  return (aiResults as { results: Record<string, DemoAiResult> }).results;
}
