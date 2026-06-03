/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Produce a standalone folder (.next/standalone) that includes only the
  // files needed to run the server — ideal for Docker containers.
  output: 'standalone',
};

module.exports = nextConfig;
