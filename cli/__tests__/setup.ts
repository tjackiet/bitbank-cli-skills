import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach } from "vitest";
import { resetThrottle } from "../throttle.js";

// テスト間で profiles.json が ~/.bitbank に共有されると干渉するため、
// tmp の存在しないパスに固定して隔離する。各テスト前にファイルを削除する
// ことで CRUD 系テストが書き残した state も次テストに漏らさない。
const tmp = mkdtempSync(join(tmpdir(), "bitbank-tests-"));
const profilesPath = join(tmp, "profiles.json");
process.env.BITBANK_PROFILES_PATH = profilesPath;

beforeEach(() => {
  resetThrottle();
  rmSync(profilesPath, { force: true });
});
