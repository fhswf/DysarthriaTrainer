# Use Node 18 as the base image
FROM node:23-slim

# Install CA certificates for SSL/TLS verification
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) for dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port Vite will run on
EXPOSE 5173

# Run the Vite development server
CMD ["npm", "run", "dev"]

