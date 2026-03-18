/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow requiring CommonJS core modules from API routes
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
