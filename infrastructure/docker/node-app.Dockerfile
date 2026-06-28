FROM node:24-alpine

WORKDIR /workspace

RUN corepack enable

ARG PACKAGE_FILTER
ENV PACKAGE_FILTER=${PACKAGE_FILTER}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY apps ./apps
COPY services ./services
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter "${PACKAGE_FILTER}..." build

CMD pnpm --filter "${PACKAGE_FILTER}" start
