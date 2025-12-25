# Docker Deployment Guide

## Prerequisites

- Docker Desktop installed and running
- `.env.local` file with all required environment variables

## Quick Start

### Option 1: Using PowerShell Script (Recommended)

```powershell
# Run the automated build and deployment script
.\docker-build.ps1
```

This script will:
1. Check if Docker is running
2. Stop any existing container
3. Build the Docker image
4. Start the container with docker-compose
5. Wait for the application to be healthy
6. Open the browser automatically

### Option 2: Manual Docker Compose

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 3: Manual Docker Commands

```bash
# Build the image
docker build -t google-ads-system:latest .

# Run the container
docker run -d \
  --name google-ads-system-app \
  -p 3000:3000 \
  --env-file .env.local \
  google-ads-system:latest

# View logs
docker logs -f google-ads-system-app

# Stop and remove
docker stop google-ads-system-app
docker rm google-ads-system-app
```

## Environment Variables

Ensure your `.env.local` file contains:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# SMS Provider (optional)
SMS_PROVIDER=mock
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Useful Commands

### Container Management

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View logs (follow mode)
docker logs -f google-ads-system-app

# View last 100 lines
docker logs --tail 100 google-ads-system-app

# Restart container
docker restart google-ads-system-app

# Access container shell
docker exec -it google-ads-system-app sh
```

### Image Management

```bash
# List images
docker images

# Remove old images
docker image prune

# Remove specific image
docker rmi google-ads-system:latest
```

### Troubleshooting

```bash
# Check container status
docker inspect google-ads-system-app

# View container resource usage
docker stats google-ads-system-app

# Rebuild without cache
docker build --no-cache -t google-ads-system:latest .

# View build output
docker-compose up --build
```

## Health Check

The application includes a health check endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-25T12:00:00.000Z",
  "service": "google-ads-system"
}
```

## Production Deployment

### Build Optimization

The Dockerfile uses multi-stage builds:
1. **deps**: Install dependencies
2. **builder**: Build Next.js application
3. **runner**: Minimal production image

This results in a ~150MB final image (vs ~1GB unoptimized).

### Security Features

- Runs as non-root user (nextjs:nodejs)
- Only includes necessary files
- Production dependencies only
- Health checks enabled

### Port Configuration

Default port: `3000`

To use a different port:

```bash
# Edit docker-compose.yml
ports:
  - "8080:3000"  # Map host 8080 to container 3000
```

## Stopping the Application

```bash
# Stop container (keeps data)
docker-compose stop

# Stop and remove container
docker-compose down

# Stop, remove container and volumes
docker-compose down -v
```

## Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

## Performance Notes

- First build: 5-10 minutes
- Subsequent builds: 1-2 minutes (with cache)
- Container startup: 5-10 seconds
- Memory usage: ~150-200MB
- CPU usage: Low (idle), Moderate (under load)

## Common Issues

### Port Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
```

### Build Fails

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Container Won't Start

```bash
# Check logs for errors
docker logs google-ads-system-app

# Verify environment variables
docker exec google-ads-system-app env

# Check health status
docker inspect --format='{{.State.Health.Status}}' google-ads-system-app
```

## Support

For issues or questions:
1. Check container logs: `docker logs google-ads-system-app`
2. Verify environment variables in `.env.local`
3. Ensure Docker Desktop is running
4. Check port 3000 is available
