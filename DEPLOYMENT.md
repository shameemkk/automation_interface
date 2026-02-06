# Deployment Guide for Coolify

This document explains how to deploy the Automation Interface application using Coolify.

## Prerequisites

- Coolify instance running
- GitHub/GitLab repository connected to Coolify
- Supabase project set up

## Environment Variables

Set these environment variables in Coolify:

### Required Variables

```bash
# Next.js
NODE_ENV=production

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication Secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-random-secret-key-here

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

## Coolify Deployment Steps

### 1. Create New Application in Coolify

1. Go to your Coolify dashboard
2. Click **"New Resource"** → **"Application"**
3. Choose your Git repository
4. Select the branch (e.g., `main`)

### 2. Configure Build Settings

- **Build Pack**: Docker
- **Dockerfile Location**: `./Dockerfile`
- **Port**: 3000

### 3. Set Environment Variables

Add all the environment variables listed above in the Coolify environment variables section.

### 4. Deploy

Click **"Deploy"** and Coolify will:
1. Clone your repository
2. Build the Docker image
3. Run the container
4. Make it available at your configured domain

## Docker Build Details

The Dockerfile uses a multi-stage build:

1. **deps**: Installs dependencies
2. **builder**: Builds the Next.js application
3. **runner**: Creates minimal production image

### Build Optimization

- Uses `standalone` output mode for smaller image size
- Multi-stage build reduces final image size
- Only production dependencies included
- Runs as non-root user for security

## Database Migrations

Run Supabase migrations manually before deploying:

```bash
# Using Supabase CLI
supabase db push

# Or apply migrations in Supabase dashboard SQL editor
```

Migrations are in `supabase/migrations/` directory.

## Testing Locally with Docker

```bash
# Build the image
docker build -t automation-interface .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e AUTH_SECRET=your-secret \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=password \
  automation-interface
```

Visit http://localhost:3000

## Health Check

After deployment, verify:

1. App is accessible at your domain
2. Login page loads correctly
3. Can log in with admin credentials
4. Database connections work

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (using Node 20)
- Check Coolify build logs

### Runtime Errors

- Verify all environment variables are set correctly
- Check Supabase connection (URL and service role key)
- Check application logs in Coolify

### Database Issues

- Ensure Supabase migrations are applied
- Verify service role key has proper permissions
- Check RLS policies are configured correctly

## Updating the Application

1. Push changes to your Git repository
2. Coolify will automatically rebuild and redeploy (if auto-deploy is enabled)
3. Or manually click **"Redeploy"** in Coolify

## Rollback

If deployment fails:
1. Go to Coolify dashboard
2. Click on your application
3. Select **"Deployments"** tab
4. Click **"Redeploy"** on a previous successful deployment
