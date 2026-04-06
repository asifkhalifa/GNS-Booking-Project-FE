/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** Faster prod builds; gzip/brotli is handled by the platform (e.g. Vercel). */
  compress: true,
}

export default nextConfig
