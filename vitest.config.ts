import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		setupFiles: ["cli/__tests__/setup.ts"],
		testTimeout: 15000,
		coverage: {
			provider: "v8",
			include: ["cli/**/*.ts"],
			exclude: [
				"cli/__tests__/**",
				"cli/index.ts", // subprocess 経由でのみ実行されるエントリ
				"cli/types.ts", // 型定義のみ
			],
			thresholds: {
				statements: 80,
				branches: 70,
				functions: 80,
				lines: 80,
			},
		},
	},
});
