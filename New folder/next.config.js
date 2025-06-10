/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // This will make pages that require Supabase be rendered at runtime
    appDir: true,
  }
}

module.exports = nextConfig 