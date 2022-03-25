import { createClient } from "redis";

const TWELVE_HOURS = 60 * 60 * 12;

function key(reqPath) {
  const base64 = Buffer.from(reqPath).toString("base64");
  return `rproxy_${base64}`;
}

export default class RedisClient {
  constructor(url, opts) {
    this.client = createClient({ url });
    this.ttl = opts?.ttl || TWELVE_HOURS;
    this.client.connect();
  }

  async get(reqPath) {
    const data = await this.client.get(key(reqPath));
    return data;
  }

  async set(reqPath, data) {
    await this.client.set(key(reqPath), data, { EX: this.ttl });
    return;
  }
}
