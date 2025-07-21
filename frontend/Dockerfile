FROM node:16-alpine as build-stage

# Accept BUILD_ENV as build argument (default to 'dev')
ARG BUILD_ENV=dev

WORKDIR /usr/src/app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./

# Copy the appropriate .env file based on BUILD_ENV
RUN if [ "$BUILD_ENV" = "prod" ] ; then \
        cp .env .env.production.local ; \
    else \
        cp .env.development .env.production.local ; \
    fi

RUN npm run build

FROM nginx:1.15.2-alpine
COPY --from=build-stage /usr/src/app/build/ /var/www
COPY frontend/nginx.conf /etc/nginx/nginx.conf
EXPOSE 5000
ENTRYPOINT ["nginx","-g","daemon off;"]