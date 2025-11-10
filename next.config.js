/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static page generation errors during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Export configuration
  experimental: {
    // Ensure pages with useSearchParams are not statically generated
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig

