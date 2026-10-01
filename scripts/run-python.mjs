// Runs a Python script with whichever interpreter exists: python3 (Linux/macOS), python or py (Windows).
import { spawnSync } from "node:child_process";
const args = process.argv.slice(2);
for (const bin of ["python3", "python", "py"]) {
  const probe = spawnSync(bin, ["--version"], { stdio: "ignore", shell: process.platform === "win32" });
  if (probe.status !== 0) continue;
  const r = spawnSync(bin, args, { stdio: "inherit", shell: process.platform === "win32" });
  process.exit(r.status ?? 1);
}
console.error("No se encontró Python. Instálalo desde https://www.python.org marcando «Add Python to PATH».");
process.exit(1);
