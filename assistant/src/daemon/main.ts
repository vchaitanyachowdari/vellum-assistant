#!/usr/bin/env bun
import { runDaemon } from './lifecycle.js';

runDaemon().catch((err) => {
  console.error('Failed to start daemon:', err);
  process.exit(1);
});
