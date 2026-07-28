import { build } from "esbuild";
import dotenv from "dotenv";

dotenv.config();

const envKeys = [
    "FIREBASE_API_KEY",
    "FIREBASE_AUTH_DOMAIN",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_STORAGE_BUCKET",
    "FIREBASE_MESSAGING_SENDER_ID",
    "FIREBASE_APP_ID",
];

const define = {};
for (const key of envKeys) {
    if (!process.env[key]) {
        console.warn(`Warning: ${key} is not set in .env`);
    }
    define[`process.env.${key}`] = JSON.stringify(process.env[key] ?? "");
}

build({
    entryPoints: ["js/app.js"],
    bundle: true,
    format: "esm",
    outfile: "js/bundle.js",
    define,
}).catch(() => process.exit(1));