"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
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
  const [reloadTick, setReloadTick] = useState(0);
  const initialDataRef = useRef(initialData);
  const initialMetaRef = useRef<ReadMeta>(initialMeta ?? { source: "mock", error: null });

  useEffect(() => {
    initialDataRef.current = initialData;
    initialMetaRef.current = initialMeta ?? { source: "mock", error: null };
  }, [initialData, initialMeta]);

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
    setData(initialDataRef.current);
    setMeta(initialMetaRef.current);

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    void runLoad(() => !isCancelled);

    return () => {
      isCancelled = true;
    };
  }, [enabled, reloadKey, reloadTick]);

  function reload() {
    if (!enabled) {
      setData(initialDataRef.current);
      setMeta(initialMetaRef.current);
      setIsLoading(false);
      return;
    }

    setReloadTick((current) => current + 1);
  }

  return {
    data,
    meta,
    isLoading,
    reload,
  };
}
