/** @type {import('next').NextConfig} */
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || process.env.CDN_URL

const nextConfig = {
	assetPrefix: CDN_URL ? CDN_URL.replace(/\/$/, '') : undefined,
}

module.exports = nextConfig
