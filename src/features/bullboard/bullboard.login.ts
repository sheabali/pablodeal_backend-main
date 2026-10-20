export const LOGIN_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in — Bull Board</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #0f172a; display: flex; align-items: center; justify-content: center;
      min-height: 100vh; color: #e2e8f0;
    }
    .card {
      background: #1e293b; border-radius: 12px; padding: 40px; width: 100%; max-width: 400px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,.5);
    }
    .card h1 { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
    .card p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
    .card label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; color: #cbd5e1; }
    .card input {
      width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #334155;
      background: #0f172a; color: #e2e8f0; font-size: 14px; outline: none; margin-bottom: 16px;
      transition: border-color .15s;
    }
    .card input:focus { border-color: #6366f1; }
    .card button {
      width: 100%; padding: 10px; border-radius: 8px; border: none;
      background: #6366f1; color: #fff; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background .15s;
    }
    .card button:hover { background: #4f46e5; }
    .error { color: #f87171; font-size: 13px; margin-bottom: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Bull Board</h1>
    <p>Sign in to view queue dashboard</p>
    <form method="post" action="/admin/queues/login">
      <label for="user">Username</label>
      <input id="user" name="user" type="text" autocomplete="username" required autofocus />
      <label for="pass">Password</label>
      <input id="pass" name="pass" type="password" autocomplete="current-password" required />
      <div class="error" id="error"></div>
      <button type="submit">Sign in</button>
    </form>
  </div>
  <script>
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "1") document.getElementById("error").textContent = "Invalid username or password";
  </script>
</body>
</html>`;
