// Penyimpanan memori disimpan di globalThis; test perlu bisa mengosongkannya.
declare global {
  var __testaraMemory: unknown;
}
export {};
