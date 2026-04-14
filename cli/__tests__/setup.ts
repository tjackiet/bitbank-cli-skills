import { beforeEach } from "vitest";
import { resetThrottle } from "../throttle.js";

/** 全テストでスロットル状態をリセットし、テスト間の干渉を防ぐ */
beforeEach(() => resetThrottle());
