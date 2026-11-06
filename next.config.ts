import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 브라우저 콘솔을 터미널로 보내지 않아요 (Windows에서 로그 파일 감시로 새로고침이 반복되는 문제 방지)
  logging: { browserToTerminal: false },
  // dev 전용 MCP 로그 파일(.next/dev/logs)이 Windows에서 새로고침 반복을 일으켜 꺼 둬요.
  experimental: { mcpServer: false },
  // 서비스 개편: 두 기능(별의 끝에서, 미니띠니)만 노출. 예전 페이지 코드는 남겨 두고 홈으로 보내요.
  // 기본 보안 헤더 (다른 사이트에 끼워 넣기·MIME 추측 방지 등)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return ["/create", "/battle", "/battle/:id", "/growth"].map((source) => ({ source, destination: "/", permanent: false }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
