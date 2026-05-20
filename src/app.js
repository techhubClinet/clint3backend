/**
 * Vercel entry shim — some deployments still resolve /var/task/src/app.js.
 * Must default-export a function or http.Server (not a bare Express app).
 */
import { createServer } from "node:http";
import { createApp } from "./expressApp.js";

const server = createServer(createApp());

export default server;
