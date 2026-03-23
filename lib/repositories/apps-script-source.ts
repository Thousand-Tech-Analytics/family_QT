type AppsScriptEnvelope<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
};

export type RemotePassageRecord = {
  local_date: string;
  reference: string;
};

export type RemoteEntryRecord = {
  entry_id: string;
  member_id: string;
  local_date: string;
  created_at: string;
  status?: "draft" | "published";
  passage_reference_snapshot: string;
  memorable_line?: string;
  reflection: string;
  application_or_prayer?: string;
  replyCount?: number;
};

export type RemoteReplyRecord = {
  reply_id: string;
  entry_id: string;
  member_id: string;
  body: string;
  created_at: string;
  updated_at?: string;
};

export type RemoteMonthSummaryRecord = {
  local_date: string;
  entry_count: number;
};

type RemoteReadResult<T> = {
  data: T | null;
  error: string | null;
};

let hasLoggedUrlDetection = false;

function debugLog(message: string, details?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (details === undefined) {
    console.info(`[apps-script] ${message}`);
    return;
  }

  console.info(`[apps-script] ${message}`, details);
}

function getAppsScriptWebAppUrl() {
  const url = process.env.NEXT_PUBLIC_APPS_SCRIPT_WEBAPP_URL?.trim() || null;

  if (!hasLoggedUrlDetection && typeof window !== "undefined") {
    hasLoggedUrlDetection = true;
    debugLog("Public Apps Script URL detection", {
      hasUrl: Boolean(url),
      mode: process.env.NODE_ENV,
    });
  }

  return url;
}

export function hasAppsScriptPublicUrl() {
  return Boolean(getAppsScriptWebAppUrl());
}

export function shouldUseAppsScriptRuntime() {
  return process.env.NODE_ENV === "production" && Boolean(getAppsScriptWebAppUrl());
}

function createAppsScriptUrl(action: string, params: Record<string, string>) {
  const baseUrl = getAppsScriptWebAppUrl();

  if (!baseUrl) {
    return null;
  }

  const searchParams = new URLSearchParams({
    action,
    ...params,
  });

  return `${baseUrl}?${searchParams.toString()}`;
}

function normalizeEnvelope<T>(payload: AppsScriptEnvelope<T> | T) {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    !Array.isArray(payload)
  ) {
    const envelope = payload as AppsScriptEnvelope<T>;

    if (envelope.ok === false) {
      throw new Error(envelope.error || "Apps Script responded with an error");
    }

    return envelope.data ?? null;
  }

  return payload as T;
}

async function fetchAppsScriptJson<T>(
  action: string,
  params: Record<string, string>,
): Promise<RemoteReadResult<T>> {
  const url = createAppsScriptUrl(action, params);

  debugLog("URL detected", {
    hasUrl: Boolean(url),
    action,
  });

  if (!url) {
    debugLog("No Apps Script URL configured", { action });
    return {
      data: null,
      error: null,
    };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Apps Script responded with ${response.status}`);
    }

    const payload = (await response.json()) as AppsScriptEnvelope<T> | T;

    debugLog("Remote fetch succeeded", { action, strategy: "json" });

    return {
      data: normalizeEnvelope(payload),
      error: null,
    };
  } catch (error) {
    debugLog("Remote fetch failed", {
      action,
      strategy: "json",
      error: error instanceof Error ? error.message : "Unknown Apps Script fetch error",
    });
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown Apps Script fetch error",
    };
  }
}

async function fetchAppsScriptJsonp<T>(
  action: string,
  params: Record<string, string>,
): Promise<RemoteReadResult<T>> {
  if (typeof window === "undefined") {
    return {
      data: null,
      error: "JSONP is only available in the browser",
    };
  }

  const callbackName = `familyQtJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const url = createAppsScriptUrl(action, {
    ...params,
    callback: callbackName,
  });

  if (!url) {
    return {
      data: null,
      error: null,
    };
  }

  return new Promise<RemoteReadResult<T>>((resolve) => {
    const script = document.createElement("script");
    const cleanup = () => {
      delete (window as typeof window & Record<string, unknown>)[callbackName];
      script.remove();
    };

    (window as typeof window & Record<string, unknown>)[callbackName] = (
      payload: AppsScriptEnvelope<T> | T,
    ) => {
      try {
        debugLog("Remote fetch succeeded", { action, strategy: "jsonp" });
        resolve({
          data: normalizeEnvelope(payload),
          error: null,
        });
      } catch (error) {
        resolve({
          data: null,
          error: error instanceof Error ? error.message : "Unknown Apps Script JSONP error",
        });
      } finally {
        cleanup();
      }
    };

    script.onerror = () => {
      debugLog("Remote fetch failed", {
        action,
        strategy: "jsonp",
        error: "Apps Script JSONP request failed",
      });
      resolve({
        data: null,
        error: "Apps Script JSONP request failed",
      });
      cleanup();
    };

    script.src = url;
    document.body.appendChild(script);
  });
}

async function readAppsScriptAction<T>(
  action: string,
  params: Record<string, string>,
): Promise<RemoteReadResult<T>> {
  const jsonResult = await fetchAppsScriptJson<T>(action, params);

  if (jsonResult.data !== null || !jsonResult.error) {
    return jsonResult;
  }

  const jsonpResult = await fetchAppsScriptJsonp<T>(action, params);

  if (jsonpResult.error) {
    debugLog("All remote fetch strategies failed", {
      action,
      fetchError: jsonResult.error,
      jsonpError: jsonpResult.error,
    });
  }

  return {
    data: jsonpResult.data,
    error: jsonpResult.error || jsonResult.error,
  };
}

export async function fetchRemotePassageByDate(localDate: string) {
  return readAppsScriptAction<RemotePassageRecord | null>("getPassageByDate", {
    date: localDate,
  });
}

export async function fetchRemoteEntriesByDate(localDate: string) {
  return readAppsScriptAction<RemoteEntryRecord[]>("getEntriesByDate", {
    date: localDate,
  });
}

export async function fetchRemoteMonthSummary(month: string) {
  return readAppsScriptAction<RemoteMonthSummaryRecord[]>("getMonthSummary", {
    month,
  });
}

export async function fetchRemoteReplies(entryId: string) {
  return readAppsScriptAction<RemoteReplyRecord[]>("getReplies", {
    entryId,
  });
}

export async function fetchRemoteEntryById(entryId: string) {
  return readAppsScriptAction<RemoteEntryRecord | null>("getEntryById", {
    entryId,
  });
}
