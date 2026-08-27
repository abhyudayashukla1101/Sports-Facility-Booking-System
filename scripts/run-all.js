import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

console.log("=================================================");
console.log("🚀 Starting Playfield IITG (Backend & Frontend)");
console.log("=================================================\n");

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(rootDir, "backend"),
  stdio: "inherit",
  shell: true
});

const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(rootDir, "frontend"),
  stdio: "inherit",
  shell: true
});

process.on("SIGINT", () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
