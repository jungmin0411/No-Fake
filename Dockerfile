FROM node:20-alpine AS builder

WORKDIR /app/front

COPY front/package*.json ./
RUN npm ci

COPY front ./

ARG REACT_APP_API_BASE_URL
ARG REACT_APP_BASE_URL

ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV REACT_APP_BASE_URL=${REACT_APP_BASE_URL}

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/front/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
