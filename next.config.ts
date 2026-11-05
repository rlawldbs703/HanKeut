import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 브라우저 콘솔을 터미널로 보내지 않아요 (Windows에서 로그 파일 감시로 새로고침이 반복되는 문제 방지)
  logging: { browserToTerminal: false },
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
