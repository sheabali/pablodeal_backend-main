import { io } from "socket.io-client";

const BASE = "http://localhost:3000";

async function main() {
  // 1. Login both players
  const players = await Promise.all([
    login("p1@test.com", "pass12345", "Player1"),
    login("p2@test.com", "pass12345", "Player2"),
  ]);

  console.log("Player 1 JWT:", players[0].token.slice(0, 20) + "...");
  console.log("Player 2 JWT:", players[1].token.slice(0, 20) + "...");

  // 2. Connect both via Socket.IO
  const s1 = io(BASE, { auth: { token: players[0].token } });
  const s2 = io(BASE, { auth: { token: players[1].token } });

  s1.on("connect", () => console.log("P1 connected:", s1.id));
  s2.on("connect", () => console.log("P2 connected:", s2.id));

  // 3. P1 joins casual queue
  s1.emit("matchmaking:join", { type: "casual" });
  console.log("P1 joined casual queue...");

  // Wait a moment then P2 joins
  await sleep(500);
  s2.emit("matchmaking:join", { type: "casual" });
  console.log("P2 joined casual queue...");

  // 4. Listen for match
  s1.on("game:match_found", (data) => console.log("P1 matched!", data));
  s2.on("game:match_found", (data) => console.log("P2 matched!", data));

  s1.on("game:match_start", async (data) => {
    console.log("Match started!", data);

    // 5. Play a turn — P1 starts
    s1.on("game:turn_start", () => {
      console.log("P1 turn — starting stopwatch...");
      s1.emit("game:start_stopwatch");

      setTimeout(() => {
        s1.emit("game:stop_stopwatch");
        console.log("P1 stopped stopwatch");
      }, 50);
    });

    s1.on("game:result", (result) => {
      console.log("Result:", result);
    });

    s1.on("game:score_update", (score) => {
      console.log("Score:", score);
    });

    s1.on("game:match_end", (final) => {
      console.log("Match ended!", final);
      s1.disconnect();
      s2.disconnect();
    });
  });

  // Keep running
  await sleep(30000);
  s1.disconnect();
  s2.disconnect();
}

async function login(email: string, password: string, name: string) {
  await fetch(`${BASE}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  // Try login
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginBody = (await loginRes.json()) as { data: { token: string } };
  return loginBody.data;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch(console.error);
