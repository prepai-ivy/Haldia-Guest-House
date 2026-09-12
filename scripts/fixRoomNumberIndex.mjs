// One-time migration: rebuilds the unique index on Room{guestHouseId, roomNumber} so it
// only applies to ACTIVE rooms (partialFilterExpression: { isActive: true }). Without this,
// a soft-deleted room permanently blocks recreating a room with the same number in that
// guest house. Safe to re-run — skips work already done, drops nothing if already correct.
//
// Usage: node scripts/fixRoomNumberIndex.mjs

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const OLD_INDEX_KEY = { guestHouseId: 1, roomNumber: 1 };

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function sameKey(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

async function main() {
  loadEnvLocal();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set (checked process.env and .env.local)");
  }

  await mongoose.connect(uri, { bufferCommands: false });
  console.log("[db] Connected via Mongoose.");

  const collection = mongoose.connection.collection("rooms");
  const indexes = await collection.indexes();

  const matching = indexes.filter((ix) => sameKey(ix.key, OLD_INDEX_KEY));

  const alreadyCorrect = matching.find(
    (ix) => ix.unique && ix.partialFilterExpression?.isActive === true,
  );
  if (alreadyCorrect) {
    console.log(`[index] "${alreadyCorrect.name}" is already partial on isActive:true — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  for (const ix of matching) {
    console.log(`[index] Dropping "${ix.name}" (unique=${!!ix.unique}, partial=${!!ix.partialFilterExpression}).`);
    await collection.dropIndex(ix.name);
  }

  await collection.createIndex(OLD_INDEX_KEY, {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: "guestHouseId_1_roomNumber_1_active",
  });
  console.log("[index] Created guestHouseId_1_roomNumber_1_active (unique, partial on isActive:true).");

  await mongoose.disconnect();
  console.log("[db] Done.");
}

main().catch((err) => {
  console.error("[fixRoomNumberIndex] Failed:", err);
  process.exit(1);
});
