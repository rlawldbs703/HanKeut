// 커밋·공유 전에 API 키나 비밀 파일이 섞였는지 검사해요.
// 사용: npm run security:check  (전체 추적 파일)  /  node scripts/check-secrets.mjs --staged (커밋할 파일만)
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const staged = process.argv.includes("--staged");
let files;
try {
  files = execSync(staged ? "git diff --cached --name-only --diff-filter=ACM" : "git ls-files", { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
} catch {
  console.log("[보안 검사] git을 찾을 수 없어 건너뜀");
  process.exit(0);
}

const PATTERNS = [
  [/AIza[0-9A-Za-z_-]{30,}/, "Google API 키"],
  [/AQ\.[0-9A-Za-z_-]{40,}/, "Google API 키"],
  [/sk-[A-Za-z0-9_-]{20,}/, "OpenAI 등 API 키"],
  [/vck_[A-Za-z0-9_-]{20,}/, "Vercel 키"],
  [/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/, "GitHub 토큰"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "개인 키"],
  [/^\s*(LLM_API_KEY|TILON_API_KEY|[A-Z_]*SECRET[A-Z_]*|[A-Z_]*PASSWORD[A-Z_]*)[ \t]*=[ \t]*\S+/m, "값이 들어 있는 비밀 설정"],
];
const problems = [];
for (const f of files) {
  if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".env.example")) problems.push(`${f}: .env 파일은 올리면 안 돼요`);
  if (/\.(png|jpe?g|gif|ico|webp|woff2?)$/i.test(f) || f.endsWith("package-lock.json") || f === "scripts/check-secrets.mjs") continue;
  let text;
  try {
    text = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  for (const [re, name] of PATTERNS) if (re.test(text)) problems.push(`${f}: ${name}로 보이는 값`);
}
if (problems.length) {
  console.error("\n⛔ [보안 검사] 공개되면 안 되는 내용이 있어요:\n - " + problems.join("\n - ") + "\n키는 .env.local에만 두세요.\n");
  process.exit(1);
}
console.log(`✅ [보안 검사] ${files.length}개 파일에서 키·비밀 파일이 발견되지 않았어요.`);
