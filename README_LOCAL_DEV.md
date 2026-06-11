## Local Development

1. **Install dependencies**

   npm install

2. **Configure environment variables**

   Copy .env.example to .env and fill in your Supabase credentials.

   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
   Optional: SUPABASE_SERVICE_ROLE_KEY (Cloudflare Pages Functions only).

3. **Start development server**

   npm run dev

   Default URL: http://localhost:5173

4. **Production build**

   npm run build

   Output directory: dist/

5. **Preview production build**

   npm run preview

6. **Lint check**

   npm run lint
