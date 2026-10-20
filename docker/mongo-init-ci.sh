#!/bin/bash
set -e

mongosh --quiet \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  "$MONGO_INITDB_DATABASE" \
  --eval '
    const username = process.env.MONGO_APP_USERNAME;
    const password = process.env.MONGO_APP_PASSWORD;

    if (!username || !password) {
      throw new Error("CI application database credentials are required");
    }

    db.createUser({
      user: username,
      pwd: password,
      roles: [{ role: "readWrite", db: "iptsdb" }]
    });
  '
