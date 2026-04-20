# BAM-X Kaizen OS — production static-site image
# The MVP is vanilla JS + localStorage per PRODUCT_BLUEPRINT.md §4 and
# ARCHITECTURE.md §7.1. No runtime Node needed. Tests run in CI, not here.
# When the future state lands (Next.js + Postgres per ARCHITECTURE §7.3),
# introduce a second stage that builds the Node app.

FROM caddy:2.8-alpine

# Caddy serves static assets from /srv.
WORKDIR /srv

# Copy only what a browser actually fetches. .dockerignore handles the
# exclusions (tests, docs, .github, design .md files, .git, node_modules).
COPY . /srv

# Caddy config lives outside /srv so it's not served as a static asset.
COPY Caddyfile /etc/caddy/Caddyfile

# 80 for HTTP (redirects to HTTPS), 443 for HTTPS (Caddy auto-provisions
# Let's Encrypt when DOMAIN env var is set and DNS points at the VPS).
EXPOSE 80 443

# Healthcheck: Caddy's internal admin API at :2019 would work but isn't
# exposed publicly; we just curl the /health file served by Caddy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
