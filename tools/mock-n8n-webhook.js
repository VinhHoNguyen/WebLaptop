const http = require("http");

const port = Number(process.env.PORT || 5678);

const readBody = (request) =>
  new Promise((resolve) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (_error) {
        resolve({});
      }
    });
  });

const server = http.createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== "POST" || request.url !== "/webhook/laptop-chat") {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const body = await readBody(request);
  const message = String(body.message || "");

  let answer = "Xin chào! Tôi là bản mock của AI agent. Hãy hỏi tôi về laptop.";
  let products = [];

  if (/1000000|1\s?000\s?000|1tr|1 triệu/i.test(message)) {
    products = [
      { id: 1, name: "Laptop Basic 11", price: 999000, category: "Student", specs: { brand: "BudgetCo", cpu: "Celeron", ramGb: 4, storageGb: 128 } },
      { id: 2, name: "Notebook Mini", price: 1200000, category: "Office", specs: { brand: "MiniTech", cpu: "Atom X", ramGb: 8, storageGb: 256 } },
    ];
    answer = "Dưới 1,2 triệu, tôi gợi ý một số mẫu phù hợp với nhu cầu học tập và văn phòng.";
  }

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ answer, products }));
});

server.listen(port, () => {
  console.log(`Mock n8n webhook listening: http://localhost:${port}/webhook/laptop-chat`);
});
