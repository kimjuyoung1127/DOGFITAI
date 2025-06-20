# Dogfit App

This is a Next.js application for Dogfit.

## Netlify Deployment

This project is configured for deployment on Netlify.

### Environment Variables

The following environment variables must be set in your Netlify build environment for the application to function correctly:

- `NEXT_PUBLIC_SUPABASE_URL`: The URL for your Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public anonymous key for your Supabase project.

These variables are used to connect to the Supabase backend. You can find these in your Supabase project settings.
