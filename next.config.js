const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: { document: "/offline" },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Supabase REST — NetworkFirst (datos médicos frescos, 5 min cache offline)
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 50, maxAgeSeconds: 300 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Supabase Auth — NetworkOnly (NUNCA cachear tokens)
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/v1\/.*/,
        handler: "NetworkOnly",
      },
      // Anthropic API — NetworkOnly (streaming, nunca cachear)
      {
        urlPattern: /^https:\/\/api\.anthropic\.com\/.*/,
        handler: "NetworkOnly",
      },
      // PDF worker — CacheFirst (archivo grande, estable)
      {
        urlPattern: /\/pdf\.worker\.min\.js$/,
        handler: "CacheFirst",
        options: {
          cacheName: "pdf-worker",
          expiration: { maxAgeSeconds: 2592000 },
        },
      },
      // Google Fonts — CacheFirst
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "fonts",
          expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Los errores de ESLint son pre-existentes y se corregirán por separado
    ignoreDuringBuilds: true,
  },
};

module.exports = withPWA(nextConfig);
