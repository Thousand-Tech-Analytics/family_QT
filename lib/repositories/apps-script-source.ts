import "server-only";

import { unstable_noStore as noStore } from "next/cache";

type AppsScriptEnvelope<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
};

export type RemotePassageRecord = {
  localDate: string;
  reference: string;
};

export type RemoteEntryRecord = {
  id: string;
  authorId: string;
  localDate: string;
  createdAtUtc: string;
  status?: "draft" | "published";
  passageReferenceSnapshot: string;
  memorableLine?: string;
  reflection: string;
  application?: string;
  replyCount?: number;
};

export type RemoteReplyRecord = {
  id: string;
  entryId: string;
  authorId: string;
  body: string;
  createdAtUtc: string;
};

export type RemoteMonthSummaryRecord = {
  localDate: string;
  entryCount: number;
};

function getAppsScriptWebAppUrl() {
  return process.env.APPS_SCRIPT_WEBAPP_URL?.trim() || null;
}

export function hasAppsScriptBackend() {
  return Boolean(getAppsScriptWebAppUrl());
}

async function fetchAppsScriptAction<T>(
  action: string,
  params: Record<string, string>,
): Promise<T | null> {
  const baseUrl = getAppsScriptWebAppUrl();

  if (!baseUrl) {
    return null;
  }

  noStore();

  const searchParams = new URLSearchParams({
    action,
    ...params,
  });

  try {
    const response = await fetch(`${baseUrl}?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Apps Script responded with ${response.status}`);
    }

    const payload = (await response.json()) as AppsScriptEnvelope<T> | T;

    if (
      payload &&
      typeof payload === "object" &&
      "data" in payload &&
      !Array.isArray(payload)
    ) {
      const envelope = payload as AppsScriptEnvelope<T>;

      if (envelope.ok === false) {
        throw new Error(envelope.error || `Apps Script action failed: ${action}`);
      }

      return envelope.data ?? null;
    }

    return payload as T;
  } catch (error) {
    console.error(`Failed to fetch Apps Script action "${action}"`, error);
    return null;
  }
}

export async function fetchRemotePassageByDate(localDate: string) {
  return fetchAppsScriptAction<RemotePassageRecord | null>("getPassageByDate", {
    date: localDate,
  });
}

export async function fetchRemoteEntriesByDate(localDate: string) {
  return fetchAppsScriptAction<RemoteEntryRecord[]>("getEntriesByDate", {
    date: localDate,
  });
}

export async function fetchRemoteMonthSummary(month: string) {
  return fetchAppsScriptAction<RemoteMonthSummaryRecord[]>("getMonthSummary", {
    month,
  });
}

export async function fetchRemoteReplies(entryId: string) {
  return fetchAppsScriptAction<RemoteReplyRecord[]>("getReplies", {
    entryId,
  });
}

export async function fetchRemoteEntryById(entryId: string) {
  return fetchAppsScriptAction<RemoteEntryRecord | null>("getEntryById", {
    entryId,
  });
}
