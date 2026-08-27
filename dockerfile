FROM node:18-alpine

WORKDIR /app

# نصب dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
