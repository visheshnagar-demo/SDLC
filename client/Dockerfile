# Build Stage
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . ./
RUN npm run build

# Production Stage with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config to support React client-side routing
RUN printf 'server {\n\
    listen 8080;\n\
    server_name localhost;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
