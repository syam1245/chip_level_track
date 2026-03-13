/**
 * testDb.js — in-memory MongoDB lifecycle helpers.
 *
 * Uses mongodb-memory-server to spin up an isolated DB for each integration
 * test suite. Install the package first:
 *   npm install --save-dev mongodb-memory-server
 *
 * Usage in a test file:
 *   import { startDb, stopDb, clearDb } from "../helpers/testDb.js";
 *   beforeAll(startDb);
 *   afterEach(clearDb);   // wipe between tests so they don't bleed into each other
 *   afterAll(stopDb);
 */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

export async function startDb() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
}

export async function stopDb() {
    await mongoose.disconnect();
    await mongoServer.stop();
}

/** Drop every collection — faster than re-creating the whole server */
export async function clearDb() {
    const collections = mongoose.connection.collections;
    await Promise.all(
        Object.values(collections).map((col) => col.deleteMany({}))
    );
}
