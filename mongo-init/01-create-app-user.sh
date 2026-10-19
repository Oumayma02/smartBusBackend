
#!/bin/bash
set -eu

# The official MongoDB image runs initialization scripts against
# a temporary local MongoDB instance during first-time setup.
# That instance does not require authentication.
mongosh --quiet --eval '
  const admin = db.getSiblingDB("admin");
  admin.createUser({
    user: process.env.MONGO_APP_USERNAME,
    pwd: process.env.MONGO_APP_PASSWORD,
    roles: [{ role: "readWrite", db: "iptsdb" }]
  });
  print("Created SmartBus application user.");
'
