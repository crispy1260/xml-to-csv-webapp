
# Use Node 10 base image
FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Copy app files
COPY . .

# Install dependencies
RUN npm install

# Ensure necessary folders exist
RUN mkdir -p uploads output

# Expose the app port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
