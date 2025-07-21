FROM node:16-alpine as build-stage
WORKDIR /usr/src/app
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

FROM nginx:1.15.2-alpine
COPY --from=build-stage /usr/src/app/build/ /var/www
COPY frontend/nginx.conf /etc/nginx/nginx.conf
EXPOSE 5000
ENTRYPOINT ["nginx","-g","daemon off;"]