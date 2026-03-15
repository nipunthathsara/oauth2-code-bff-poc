# React OIDC + WSO2 Identity Server 7.2.0 — Docker Compose Setup

## What this gives you

| Service | URL | Description |
|---|---|---|
| **React App** | http://localhost | Your SPA with Login + Register |
| **WSO2 IS Console** | https://localhost:9443/console | Admin console (admin / admin) |
| **WSO2 My Account** | https://localhost:9443/myaccount | User self-service |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- At least **4 GB RAM** allocated to Docker (WSO2 IS is Java-based and needs memory)
- Ports **80** and **9443** free on your machine

---

## Project Structure

```
react-oidc-wso2/
├── docker-compose.yml           ← Main orchestration file
├── wso2is/
│   └── deployment.toml          ← WSO2 IS configuration (CORS, self-reg, etc.)
├── init-scripts/
│   └── init-wso2is.sh           ← Auto-creates the OIDC app in WSO2 IS
└── react-app/
    ├── Dockerfile               ← Multi-stage: build React → serve via nginx
    ├── package.json
    ├── public/index.html
    ├── src/
    │   ├── index.js             ← AuthProvider setup
    │   ├── App.js               ← Routes: / /callback /home
    │   ├── index.css
    │   └── components/
    │       ├── LandingPage.js   ← Login + Register buttons
    │       ├── HomePage.js      ← Authenticated view with user info
    │       └── LoadingSpinner.js
    └── nginx/
        ├── nginx.conf           ← SPA routing config
        └── entrypoint.sh        ← Injects client_id into window._env_
```

---

## How to Start

### Step 1 — Start everything

```bash
cd react-oidc-wso2
docker compose up --build
```

> ⏳ **First boot takes 3–5 minutes.**  
> WSO2 IS needs to initialise its H2 database. Watch the logs with:
> ```bash
> docker compose logs -f wso2is
> ```
> Wait until you see: `WSO2 Identity Server started`

### Step 2 — Trust the self-signed certificate (IMPORTANT)

WSO2 IS uses a self-signed TLS certificate. Before logging in, you **must** tell your browser to trust it:

1. Open **https://localhost:9443** in your browser  
2. Click **Advanced → Proceed to localhost (unsafe)**  
3. You should see the WSO2 login page — that's all you need to do here

> Without this step, the OIDC login redirect will fail silently.

### Step 3 — Open the app

Go to **http://localhost** — you'll see the login page.

---

## User Flows

### Register a new user
1. Click **"Create an Account"** on the landing page
2. This opens the WSO2 IS self-registration portal (https://localhost:9443/...)
3. Fill in username, password, and details → Submit
4. Return to http://localhost and sign in

### Login
1. Click **"Sign In"**
2. You'll be redirected to the WSO2 IS login page
3. Enter your credentials → click Sign In
4. You'll be redirected back to the app and see your profile

### Logout
- Click **"Sign Out"** on the home page

---

## Troubleshooting

### "MISSING_CLIENT_ID" in the app
The init container didn't finish. Check:
```bash
docker compose logs wso2is-init
```
If WSO2 IS wasn't ready in time, restart just the init container:
```bash
docker compose restart wso2is-init
# Wait 30 seconds, then restart the app
docker compose restart react-app
```

### Login page shows "Unauthorized" or "Invalid client"
The OIDC app may not have been created correctly. Check the init logs:
```bash
docker compose logs wso2is-init
```
You can also verify the app exists in the WSO2 Console:  
https://localhost:9443/console → **Applications** → look for "ReactOIDCApp"

### WSO2 IS won't start / keeps restarting
- Make sure Docker has at least 4 GB RAM
- Check logs: `docker compose logs wso2is`
- Try: `docker compose down -v && docker compose up --build` (clears volumes, fresh start)

### Browser blocks the OIDC redirect
You haven't trusted the certificate yet. See **Step 2** above.

---

## Stopping

```bash
docker compose down
```

To also delete all stored data (WSO2 IS database, users, config):
```bash
docker compose down -v
```

---

## How it works (architecture)

```
Browser
  │
  ├─── http://localhost ──────────────→ nginx (react-app container)
  │                                       serves built React SPA
  │
  └─── https://localhost:9443 ────────→ WSO2 Identity Server container
                                          OIDC authorize / token / userinfo

Docker internal network (app-network):
  wso2is-init ──→ wso2is:9443  (creates app via REST API)
               └→ shared-config volume (writes client_id)
  
  react-app entrypoint.sh reads shared-config/client_id
  and writes /usr/share/nginx/html/env-config.js
  which the browser loads as <script src="/env-config.js">
```

### OIDC Flow (PKCE)
1. User clicks Sign In → React SDK generates `code_verifier` + `code_challenge`
2. Browser redirects to `https://localhost:9443/oauth2/authorize?...`
3. User authenticates on WSO2 IS
4. WSO2 IS redirects to `http://localhost/callback?code=...`
5. React SDK exchanges code for tokens at `https://localhost:9443/oauth2/token`
6. Tokens stored in browser session storage
7. App navigates to `/home` and shows user profile

---

## Customisation

### Add more users / admins
Visit https://localhost:9443/console → **User Management** → **Users** → **+ Add User**

### Change admin password
Edit `docker-compose.yml` and `wso2is/deployment.toml`, change `admin` / `admin`.  
Then run: `docker compose down -v && docker compose up --build`

### Enable email verification for self-registration
In `wso2is/deployment.toml`:
```toml
[identity_mgt.user_self_registration]
send_confirmation_on_creation = true
lock_on_creation = true
```
You'll also need to configure an SMTP server in deployment.toml.

### Add social login (Google, GitHub, etc.)
In https://localhost:9443/console → **Identity Providers** → **+ Add Identity Provider**
