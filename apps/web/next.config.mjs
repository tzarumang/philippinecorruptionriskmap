/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source rather than a build artifact,
  // so Next compiles them as part of the app.
  transpilePackages: ['@pcrm/types', '@pcrm/resolution'],
  typedRoutes: true,
};

export default nextConfig;
