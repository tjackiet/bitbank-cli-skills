/** bot / AI エージェントがリトライ判断に使う exit code 体系 */
export const EXIT = {
  SUCCESS: 0,
  GENERAL: 1,
  AUTH: 2,
  RATE_LIMIT: 3,
  PARAM: 4,
  NETWORK: 5,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];
