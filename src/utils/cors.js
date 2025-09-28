// CORS utility for Vercel serverless functions
// Handles cross-origin requests for the neurology residency hub

import Cors from 'cors';

// Initialize the cors middleware
const cors = Cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'https://hubjr-neurology.vercel.app', // Your Vercel domain
    'https://*.vercel.app' // Any Vercel preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'X-Requested-With',
    'Access-Control-Allow-Origin',
    'X-HTTP-Method-Override',
    'Content-Type',
    'Authorization',
    'Accept'
  ]
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export { cors, runMiddleware };