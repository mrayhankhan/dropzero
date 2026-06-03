import { isDsqlConfigured } from "./db";
import { createDsqlStore } from "./store-dsql";
import { createMemoryStore } from "./store-memory";
import type { Store } from "./types";

const g = globalThis as unknown as { __dropzeroStore?: Store };

/**
 * Picks the data layer at runtime:
 *  - Aurora DSQL when DSQL_CLUSTER_ENDPOINT is configured (the real, judged path)
 *  - in-memory otherwise (so the UI runs instantly with no credentials)
 */
export function getStore(): Store {
  if (!g.__dropzeroStore) {
    g.__dropzeroStore = isDsqlConfigured()
      ? createDsqlStore()
      : createMemoryStore();
  }
  return g.__dropzeroStore;
}
