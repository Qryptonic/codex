# Build stage
# Use a specific Node version LTS (e.g., 20) for reproducibility
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and lock file
# Use lock file (package-lock.json or yarn.lock) for deterministic builds
COPY package.json package-lock.json* ./ 
# If using yarn, copy yarn.lock instead
# COPY package.json yarn.lock ./

# Install dependencies
# Use --frozen-lockfile (npm) or --frozen-lockfile (yarn) for CI/builds
RUN npm ci 
# If using yarn: 
# RUN yarn install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the React app
RUN npm run build

# --- Production stage ---
# Use a lightweight nginx image
FROM nginx:1.25-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built static files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (standard HTTP port)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -fs http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 