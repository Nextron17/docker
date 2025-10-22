FROM node:18 AS builder
WORKDIR /home/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /home/app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /home/app/dist ./dist
EXPOSE 4000
CMD ["npm", "run", "start"]