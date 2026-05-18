FROM public.ecr.aws/docker/library/node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]