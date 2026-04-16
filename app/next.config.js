/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@solana/web3.js'],
};

module.exports = nextConfig;