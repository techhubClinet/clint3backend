/**
 * Vercel entry — must import "express" directly (required by Vercel Express detection).
 */
import express from "express";
import { createApp } from "./src/expressApp.js";

const app = createApp();

export default app;
