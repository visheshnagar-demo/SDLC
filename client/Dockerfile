FROM node:18-alpine AS build

WORKDIR /app
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY client/package*.json ./
RUN npm install

COPY client/ .
RUN npm run build

FROM nginx:alpine
# PORT:-8080
COPY --from=build /app/dist /usr/share/nginx/html
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
