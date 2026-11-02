FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx tsc

FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/source/scripts/gerarChaves.js ./source/scripts/gerarChaves.js
COPY migrations ./migrations

EXPOSE 5001

CMD ["sh", "-c", "if [ ! -s private.key ] && [ ! -s public.key ] && [ -z \"$JWT_PRIVATE_KEY\" ] && [ -z \"$JWT_PUBLIC_KEY\" ] && [ -z \"$JWT_PRIVATE_KEY_PATH\" ] && [ -z \"$JWT_PUBLIC_KEY_PATH\" ]; then node source/scripts/gerarChaves.js; fi; node dist/source/scripts/migrar.js && node dist/source/main.js"]