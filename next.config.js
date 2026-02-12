/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // 如果部署到 github.io/repo-name/，需要取消下面 basePath 的注释并修改为你的仓库名
  // basePath: process.env.NODE_ENV === 'production' ? '/real-time-fund' : '',
};

module.exports = nextConfig;
