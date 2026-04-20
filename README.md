# BAM-X Kaizen Operating System

Executable surface for the Business Agility Mechanism. Turns the BAM Standard Work catalog into an auto-composed Daily / Weekly / Sprint / Monthly operating rhythm, with first-class support for the 30-Day Kaizen Accelerator project type. Detailed design docs in the repo root (`PRODUCT_BLUEPRINT.md`, `ARCHITECTURE.md`, `ENGINE_DESIGN.md`, `UX_FLOWS.md`, `DELIVERY_PLAN.md`, `AI_AGENTS.md`, `PROJECT_TYPE_30D_KAIZEN.md`, `CATALOG_GAPS.md`).

MVP is vanilla JS + localStorage per `ARCHITECTURE.md` §7.1. Zero external runtime dependencies. Forward-compatible with Next.js + PostgreSQL per §7.3.

## Local development

```bash
# Run the test suite (Node 22+, no install step)
npm test

# Serve the static app with Docker
cp .env.example .env           # DOMAIN=localhost is fine for dev
docker compose up --build
# → http://localhost
```

## Deployment (Hostinger VPS)

### One-time VPS setup

On a fresh Hostinger Ubuntu 22.04 / 24.04 VPS:

```bash
# 1. Install Docker Engine + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"  # log out / back in to take effect

# 2. Clone the repo where the deploy workflow expects it
sudo mkdir -p /opt/bamx
sudo chown "$USER":"$USER" /opt/bamx
git clone https://github.com/Klingdom/Kaizen-Accelerator.git /opt/bamx
cd /opt/bamx

# 3. Create .env with production values
cp .env.example .env
# edit .env:
#   DOMAIN=kaizen.yourdomain.com   (point an A record at the VPS IP first)
#   ACME_EMAIL=you@yourdomain.com

# 4. First deploy
./scripts/deploy.sh

# 5. Verify
./scripts/verify-setup.sh
```

### GitHub Actions auto-deploy

On every push to `main`, `.github/workflows/ci.yml` runs tests and builds the image; `.github/workflows/deploy.yml` then SSHes into the VPS and runs `./scripts/deploy.sh`.

Configure these GitHub repo secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `HOSTINGER_HOST` | VPS IP or hostname |
| `HOSTINGER_USER` | SSH user (e.g. `root` or a deploy user) |
| `HOSTINGER_SSH_KEY` | Private SSH key (PEM); add the matching public key to `~/.ssh/authorized_keys` on the VPS |
| `HOSTINGER_DEPLOY_PATH` | Absolute path on the VPS, e.g. `/opt/bamx` |

Branch protection on `main` requires CI to pass before merge; the deploy workflow triggers on the push to `main` that follows merge.

### Architecture of the deployment

Current MVP:

```
┌─────────────────────────────────────────────────┐
│ Hostinger VPS                                   │
│                                                 │
│  ┌─ docker compose ────────────────────────┐    │
│  │                                         │    │
│  │  web (Caddy 2)                          │    │
│  │  ├─ serves /srv (repo root) as static   │    │
│  │  ├─ /health → 200 ok                    │    │
│  │  ├─ auto-HTTPS via Let's Encrypt        │    │
│  │  └─ CSP, X-Frame-Options, etc.          │    │
│  │                                         │    │
│  │  db (Postgres) ─ COMMENTED OUT          │    │
│  │  └─ uncomment in Sprint 5+ per          │    │
│  │     ARCHITECTURE.md §7.3                │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
        ↑
  :80 → :443 (auto-redirect)
        │
  users + GitHub Actions deploy via SSH
```

Future state (when Sprint 5+ migrates off localStorage): uncomment the `db` service in `docker-compose.yml` and add an `app` service for the Next.js API layer. The entity shapes in `js/domain/types.js` already port cleanly to the Postgres schema sketched in `ARCHITECTURE.md` §7.3 (port-compat rule, §7.2).

### Multi-project deployment (sharing a VPS with other apps)

Default host-side ports are `8080` / `8443` (not `80` / `443`) so bamx can be deployed on a VPS that already runs other projects. The container still listens on 80 / 443 internally; only the host-side binding changes. After deploy, bamx is reachable at `http://<VPS_IP>:8080`.

**Overriding ports:** host-port mapping is driven by docker-compose variable substitution, which reads from a `.env` file at the repo root. It does NOT read from Hostinger panel env vars (those go into the container, not the shell). To change host ports on Hostinger, either:

- Commit a `.env` file at the repo root with `HTTP_PORT_HOST=80` and `HTTPS_PORT_HOST=443` (only safe on a dedicated VPS — don't commit to a public repo if it conflicts with other deployments).
- Fork the repo and edit `docker-compose.yml` port lines directly.

**Auto-HTTPS caveat:** Caddy's default Let's Encrypt flow uses ACME HTTP-01 (needs port 80 publicly reachable on this container) or TLS-ALPN-01 (needs port 443). When bamx is on alt ports, pick one:

- **Recommended — host-level reverse proxy.** Run [Nginx Proxy Manager](https://nginxproxymanager.com/) or Traefik on ports 80 / 443 of the VPS. Route `kaizen.yourdomain.com` → `bamx-web:80` on the internal Docker network. The proxy terminates TLS; Caddy inside bamx serves plain HTTP (set `DOMAIN=localhost` on the bamx container so its own Caddy skips TLS).
- **DNS-01 challenge.** Configure Caddy with your DNS provider's API credentials so it can complete the ACME DNS-01 challenge without needing public port 80 / 443 on this container. Works across any port setup but requires DNS API secrets.

For the simplest first-run, deploy HTTP-only on alt ports (`DOMAIN=localhost`, `HTTP_PORT_HOST=8080`), verify the app works, then add a reverse proxy.

### Routine operations

```bash
# Tail the web container logs
ssh $HOSTINGER_USER@$HOSTINGER_HOST 'docker compose -f /opt/bamx/docker-compose.yml logs -f web'

# Force redeploy without a commit
ssh $HOSTINGER_USER@$HOSTINGER_HOST 'cd /opt/bamx && ./scripts/deploy.sh'

# Run the post-deploy verification
ssh $HOSTINGER_USER@$HOSTINGER_HOST 'cd /opt/bamx && ./scripts/verify-setup.sh'

# Rollback to a previous SHA
ssh $HOSTINGER_USER@$HOSTINGER_HOST \
  "cd /opt/bamx && git reset --hard <sha> && docker compose up -d --build"
```

## License

See `LICENSE`.
