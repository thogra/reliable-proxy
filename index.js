import express from "express";
import _ from "lodash";
import { fetchText } from "./src/data-fetcher.js";
import RedisClient from "./src/redis-client.js";
const app = express();

const port = process.env.PORT || 3000;
const redisClient = new RedisClient(
  process.env.REDIS_URL || "redis://localhost:5432"
);

const savedContentTypes = ["text/html"];
function isAllowedContentType(fetched) {
  return (
    fetched?.text &&
    _.includes(savedContentTypes, _.get(fetched, "content-type"))
  );
}

async function tryFetch(req) {
  try {
    return await fetchText(req.originalUrl);
  } catch (e) {
    console.warn("Failed to fetch", e);
    return undefined;
  }
}

app.get("/*", async (req, res) => {
  const sortedQueryString = _.join(
    _.map(_.toPairs(req.query), ([k, v]) => `${k}=${v}`).sort(),
    "_"
  );
  const sortedPath = `${req.path}-${sortedQueryString}`;
  console.log("sorted", sortedPath);
  const cached = await redisClient.get(sortedPath);
  if (cached) {
    console.log("found cached!");
    res.set("content-type", "text/html");
    res.send(cached);
    const updated = await tryFetch(req);
    if (updated?.text && isAllowedContentType(updated["content-type"])) {
      await redisClient.set(sortedPath, updated.text);
    }
    return;
  }
  const fetched = await fetchText(req.originalUrl);
  if (fetched) {
    redisClient.set(sortedPath, fetched.text);
    res.set("content-type", fetched["content-type"]);
    res.send(fetched.text);
    return;
  }
  res.statusCode(400).send("nopers");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
