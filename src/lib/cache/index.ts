import { MemoryCache } from "./memory-cache";
import { Cache } from "./cache.interface";
import { IS_DEV, IS_DOCKER_ENV, IS_VERCEL_ENV } from "lib/const";

declare global {
  // eslint-disable-next-line no-var
  var __server__cache__: Cache | undefined;
}

const createCache = () => {
  if (IS_DEV) {
    return new MemoryCache();
  } else if (IS_DOCKER_ENV) {
    return new MemoryCache();
  } else if (IS_VERCEL_ENV) {
    // return new RedisCache();
    return new MemoryCache();
  }
  return new MemoryCache();
};

const serverCache = globalThis.__server__cache__ || createCache();

if (IS_DEV) {
  globalThis.__server__cache__ = serverCache;
}

export { serverCache };
