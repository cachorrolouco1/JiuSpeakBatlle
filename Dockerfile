# Stage 1: Build React frontend and Express backend bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy codebase
COPY . .

# Compile React and Node.js production outputs
RUN npm run build

# Stage 2: Runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled bundles from workspace builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Expose server ingress port
EXPOSE 3000

# Start server CJS bundle
CMD ["npm", "start"]
