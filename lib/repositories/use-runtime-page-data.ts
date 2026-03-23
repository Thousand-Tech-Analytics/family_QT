"use client";

import { useEffect, useEffectEvent, useState } from "react";
import type { PageLoadResult, ReadMeta } from "@/lib/repositories/types";

type UseRuntimePageDataOptions<T> = {
  initialData: T;
  initialMeta?: ReadMeta;
  load: () => Promise<PageLoadResult<T>>;
  enabled: boolean;
  reloadKey: string;
};

export function useRuntimePageData<T>({
  initialData,
  initialMeta,
  load,
  enabled,
  reloadKey,
}: UseRuntimePageDataOptions<T>) {
  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState<ReadMeta>(initialMeta ?? { source: "mock", error: null });
  const [isLoading, setIsLoading] = useState(false);
  const runLoad = useEffectEvent(async (isActive: () => boolean) => {
    if (!isActive()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await load();
      if (!isActive()) {
        return;
      }
      setData(result.data);
      setMeta(result.meta);
    } catch (error) {
      if (!isActive()) {
        return;
      }
      setMeta({
        source: "mock",
        error: error instanceof Error ? error.message : "Unknown runtime data error",
      });
    } finally {
      if (isActive()) {
        setIsLoading(false);
      }
    }
  });

  useEffect(() => {
    setData(initialData);
    setMeta(initialMeta ?? { source: "mock", error: null });

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    void runLoad(() => !isCancelled);

    return () => {
      isCancelled = true;
    };
  }, [enabled, initialData, initialMeta, reloadKey]);

  return {
    data,
    meta,
    isLoading,
  };
}
