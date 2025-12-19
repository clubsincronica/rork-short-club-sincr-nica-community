FROM node:18-alpine

WORKDIR /app/backend

# Copy backend package files
COPY ./backend/package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy backend source
COPY ./backend ./

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/server.js"]
