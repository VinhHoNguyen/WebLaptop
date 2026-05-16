const targetUrl = process.env.LOAD_URL || "http://localhost:5678/webhook/laptop-chat";
const durationSeconds = Number(process.env.DURATION_SECONDS || 15);
const concurrency = Number(process.env.CONCURRENCY || 20);
const errorRateThreshold = Number(process.env.ERROR_RATE_THRESHOLD || 0.1);

const latencies = [];
let successCount = 0;
let failedCount = 0;

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
};

const worker = async (stopAt) => {
  while (Date.now() < stopAt) {
    const started = Date.now();
    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "laptop gaming duoi 2 trieu",
          history: [],
        }),
      });
      const elapsed = Date.now() - started;
      latencies.push(elapsed);

      if (res.ok) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    } catch (_error) {
      failedCount += 1;
      latencies.push(Date.now() - started);
    }
  }
};

const main = async () => {
  const stopAt = Date.now() + durationSeconds * 1000;
  const workers = Array.from({ length: concurrency }, () => worker(stopAt));
  await Promise.all(workers);

  const total = successCount + failedCount;
  const errorRate = total > 0 ? failedCount / total : 1;

  const avgLatency = latencies.length
    ? latencies.reduce((acc, n) => acc + n, 0) / latencies.length
    : 0;

  console.log("=== Load Test Result ===");
  console.log(`URL: ${targetUrl}`);
  console.log(`Duration (s): ${durationSeconds}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Total requests: ${total}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Error rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log(`Avg latency: ${avgLatency.toFixed(2)} ms`);
  console.log(`P95 latency: ${percentile(latencies, 95).toFixed(2)} ms`);

  if (errorRate > errorRateThreshold) {
    console.error(
      `Load test failed: error rate ${(errorRate * 100).toFixed(2)}% > ${(errorRateThreshold * 100).toFixed(2)}%`
    );
    process.exit(1);
  }
};

main().catch((error) => {
  console.error("Load test crashed:", error);
  process.exit(1);
});
