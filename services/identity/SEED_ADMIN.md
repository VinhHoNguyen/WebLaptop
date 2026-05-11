Seed admin user for identity service

This repository does not include a default admin account. The `seedAdmin.js` script helps create one.

Usage (recommended, run inside the running identity container):

1. Ensure the MySQL DB for identity exists (the compose stack may create `checkout_db` by default). If the database `identity_db` is missing, create it and import the schema:

```bash
docker exec -i webgame-mysql bash -lc "mysql -u root -proot_password -e 'CREATE DATABASE IF NOT EXISTS identity_db;'"
docker exec -i webgame-mysql bash -lc "cat /docker-entrypoint-initdb.d/02-identity-schema.sql | mysql -u root -proot_password identity_db"
```

2. Run the seeding script inside the identity container (uses the container's environment and node modules):

```bash
docker exec -w /app webgame-identity node scripts/seedAdmin.js
```

3. Defaults created:
- email: `admin@local`
- password: `Admin@123`

You can override values by setting environment variables before running the script, for example:

```bash
docker exec -w /app -e SEED_ADMIN_EMAIL=you@host -e SEED_ADMIN_PASSWORD=YourPass123 webgame-identity node scripts/seedAdmin.js
```

Alternative (run locally if you have Node and network access to DB):

```bash
# from repo root
node services/identity/scripts/seedAdmin.js
```

Note: the script writes into the database configured by `services/identity/config/db_conn.js` (env vars `MYSQL_HOST`, `MYSQL_DATABASE`, etc.).
