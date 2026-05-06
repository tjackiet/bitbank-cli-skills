export type LifecycleReason = "SIGINT" | "SIGTERM" | "duration" | "count" | "max-retries";

export type LifecycleConfig = {
  duration?: number;
  count?: number;
  onStop: (reason: LifecycleReason) => void;
};

export type LifecycleHandle = {
  noteEvent: () => boolean;
  fail: (reason: LifecycleReason) => void;
  teardown: () => void;
};

export function setupLifecycle(cfg: LifecycleConfig): LifecycleHandle {
  let stopped = false;
  let received = 0;
  const timers: NodeJS.Timeout[] = [];
  const sigPairs: Array<{ sig: NodeJS.Signals; fn: () => void }> = [];

  const stop = (reason: LifecycleReason): void => {
    if (stopped) return;
    stopped = true;
    cfg.onStop(reason);
  };

  if (cfg.duration && cfg.duration > 0) {
    timers.push(setTimeout(() => stop("duration"), cfg.duration * 1000));
  }

  for (const sig of ["SIGINT", "SIGTERM"] as NodeJS.Signals[]) {
    const fn = (): void => stop(sig as LifecycleReason);
    process.on(sig, fn);
    sigPairs.push({ sig, fn });
  }

  return {
    noteEvent: () => {
      received++;
      if (cfg.count && received >= cfg.count) {
        stop("count");
        return true;
      }
      return false;
    },
    fail: (reason) => stop(reason),
    teardown: () => {
      for (const t of timers) clearTimeout(t);
      for (const { sig, fn } of sigPairs) process.off(sig, fn);
    },
  };
}
