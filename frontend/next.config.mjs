/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  output: isGithubActions ? 'export' : 'standalone',
  basePath: isGithubActions ? '/CLOUD-GAURD' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;