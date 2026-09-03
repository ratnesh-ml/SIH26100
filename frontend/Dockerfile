FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY frontend/package.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY frontend/ ./

EXPOSE 5173

# Run Vite dev server with host binding for Docker networking
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
