// D:\code\CRMCup\CRM_Frontend\scripts\sync-jhipster.js
//
// Copies  ../CRM_Backend/.jhipster  →  ../CRM_Frontend/.jhipster
// and overwrites anything that exists in the destination.
//
// Run with:  npm run sync:jhipster
//

import { copy, remove } from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * ──────────────────────────────────────────────────────────────
 * Relative-path logic
 *   __dirname  = D:\code\CRMCup\CRM_Frontend\scripts
 *
 *   SRC  = ../../CRM_Backend/.jhipster
 *          ↑  ↑
 *          │  └─ go up to CRMCup, then into CRM_Backend
 *          └─ first “..” gets us from /scripts → /CRM_Frontend
 *
 *   DEST = ../.jhipster
 *          ↑
 *          └─ go up to /CRM_Frontend, then resolve .jhipster
 * ──────────────────────────────────────────────────────────────
 */
const SRC = path.resolve(__dirname, '..', '..', 'CRM_Backend', '.jhipster');
const DEST = path.resolve(__dirname, '..', '.jhipster');

(async () => {
  try {
    await remove(DEST); // start clean (optional)
    await copy(SRC, DEST, { overwrite: true });
    console.log(`✔  Synced .jhipster → ${DEST}`);
  } catch (err) {
    console.error('✖  Sync failed:', err);
    process.exit(1);
  }
})();
