# ILC portal website. Built and run by Dokploy.
# Step 1 builds the site with the API address. It defaults to the dev API; for another site (e.g. live) set the
# build argument VITE_API_URL in Dokploy (Environment > Build-time Arguments).
# Step 2 serves it with nginx and the security settings in deploy/nginx.conf, on port 3000.

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL=https://api-dev.indialeadershipcouncil.com/api
ENV VITE_API_URL=$VITE_API_URL
RUN test -n "$VITE_API_URL" || (echo "Set the build argument VITE_API_URL, e.g. https://api-dev.indialeadershipcouncil.com/api" && exit 1)
RUN npm run build

FROM nginx:1.27-alpine
# The official nginx image fills ${API_ORIGIN} and ${API_WS_ORIGIN} into the template when it starts.
COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# The API address for the security rules. Change them in Dokploy's Environment tab for another site (e.g. live).
ENV API_ORIGIN=https://api-dev.indialeadershipcouncil.com
ENV API_WS_ORIGIN=wss://api-dev.indialeadershipcouncil.com
EXPOSE 3000
