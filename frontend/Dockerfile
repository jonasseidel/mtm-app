FROM node:20 AS build

WORKDIR /app

# Install dependencies (already done by create-react-app, but safe to repeat)
COPY package*.json ./
RUN npm install

COPY . .

# Build the React app
RUN npm run build

# Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]