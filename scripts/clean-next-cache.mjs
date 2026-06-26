import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const nextDir = resolve(process.cwd(), ".next");

try {
  await rm(nextDir, { recursive: true, force: true });
  console.log("Cache de Next limpiada: .next");
} catch (error) {
  if (error && typeof error === "object" && "code" in error) {
    const code = error.code;

    if (code === "EBUSY" || code === "EPERM" || code === "ENOTEMPTY") {
      console.error("No se pudo limpiar .next porque parece estar en uso.");
      console.error("Para solucionarlo, para `next dev` y vuelve a ejecutar `pnpm clean:next`.");
      process.exit(1);
    }
  }

  throw error;
}
