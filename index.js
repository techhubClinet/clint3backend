/**
 * Primary Vercel entry (project root). Rewrites in vercel.json send all traffic here.
 */
import { createServer } from "node:http";
import { createApp } from "./src/expressApp.js";

const server = createServer(createApp());

export default server;
