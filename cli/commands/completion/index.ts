import { generateBash } from "../../completion/bash.js";
import { buildCompletionData } from "../../completion/data.js";
import { generateZsh } from "../../completion/zsh.js";
import { EXIT } from "../../exit-codes.js";
import { output } from "../../output.js";
import type { Format, Result } from "../../types.js";
import type { CommandHandler } from "../handler-types.js";

const HELP = `Usage: bitbank completion <shell>

Print a shell completion script to stdout.

Shells:
  bash    Source via: bitbank completion bash >> ~/.bashrc.d/bitbank-completion.sh
  zsh     Install via: bitbank completion zsh > "\${fpath[1]}/_bitbank"

Notes:
  - Output is a shell script (plain text). --format/--machine are ignored.
  - The script embeds command/pair lists at generation time; it does not
    invoke 'bitbank' at completion time (no network or process startup).
`;

function generate(shell: string): Result<string> {
  if (shell === "bash") return { success: true, data: generateBash(buildCompletionData()) };
  if (shell === "zsh") return { success: true, data: generateZsh(buildCompletionData()) };
  return {
    success: false,
    error: `Unsupported shell "${shell}". Use bash or zsh.`,
    exitCode: EXIT.PARAM,
  };
}

export const completionHandler: CommandHandler = async (args, values, format: Format) => {
  if (values.help === true || args.length === 0) {
    process.stdout.write(HELP);
    return;
  }
  const r = generate(args[0]);
  if (!r.success) {
    output(r, format, false, values.machine === true);
    return;
  }
  process.stdout.write(r.data);
};
