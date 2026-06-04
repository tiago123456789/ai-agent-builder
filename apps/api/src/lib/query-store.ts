import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config";
import type { SavedQuery } from "../types";

type PersistedQuery = Omit<SavedQuery, "triggerUrl">;

async function ensureStoreDir() {
  await mkdir(path.dirname(config.queriesFilePath), { recursive: true });
}

function buildTriggerUrl(id: string, name: string) {
  const url = new URL(config.queryTriggerApiUrl);
  url.searchParams.set("id", id);
  url.searchParams.set("name", name);
  return url.toString();
}

function withTriggerUrl(query: PersistedQuery): SavedQuery {
  return {
    ...query,
    triggerUrl: buildTriggerUrl(query.id, query.name),
  };
}

export async function listQueries(): Promise<SavedQuery[]> {
  await ensureStoreDir();

  try {
    const raw = await readFile(config.queriesFilePath, "utf8");
    const data = JSON.parse(raw) as PersistedQuery[];
    return data.map(withTriggerUrl);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw new Error("Could not read queries store.");
  }
}


export async function updateQuery(name: string, query: string): Promise<void> {
  await ensureStoreDir();

  try {
    const raw = await readFile(config.queriesFilePath, "utf8");
    let data = JSON.parse(raw) as PersistedQuery[];
    data = data.map(item => {
      if (item.name == name) {
        item.query = query
      }
      return item
    })

    const next = [...data];
    await writeFile(config.queriesFilePath, JSON.stringify(next, null, 2), "utf8");
  } catch (error) {
    throw new Error("Could not read queries store.");
  }
}

export async function saveQuery(name: string, query: string): Promise<SavedQuery> {
  const existing = await listQueries();
  const now = new Date().toISOString();
  const storedQuery: PersistedQuery = {
    id: crypto.randomUUID(),
    name,
    query,
    createdAt: now,
    updatedAt: now,
  };

  await ensureStoreDir();
  const next = [...existing.map(({ triggerUrl, ...rest }) => rest), storedQuery];
  await writeFile(config.queriesFilePath, JSON.stringify(next, null, 2), "utf8");

  return withTriggerUrl(storedQuery);
}
