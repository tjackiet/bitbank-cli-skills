import { output } from "../../output.js";
import type { CommandHandler } from "../handler-types.js";
import { privateAccountSchemas } from "./defs-private-account.js";
import { privateTransferSchemas } from "./defs-private-transfer.js";
import { publicDataSchemas } from "./defs-public-data.js";
import { publicMarketSchemas } from "./defs-public-market.js";
import { streamSchemas, tradeSchemas } from "./defs-trade.js";
import type { SchemaDef } from "./types.js";

const ALL: Record<string, SchemaDef> = {
  ...publicMarketSchemas,
  ...publicDataSchemas,
  ...privateAccountSchemas,
  ...privateTransferSchemas,
  ...tradeSchemas,
  ...streamSchemas,
};

function toParamsJsonSchema(params: SchemaDef["params"]): object {
  const properties: Record<string, object> = {};
  const required: string[] = [];
  for (const [name, def] of Object.entries(params)) {
    const prop: Record<string, unknown> = { type: def.type, description: def.description };
    if (def.enum) prop.enum = def.enum;
    if (def.default !== undefined) prop.default = def.default;
    properties[name] = prop;
  }
  return { type: "object", properties, required };
}

function invocationPath(name: string, schema: SchemaDef): string {
  return schema.category === "trade" ? `trade ${name}` : name;
}

function listAll(descriptions: Record<string, string>) {
  return Object.entries(ALL).map(([name, schema]) => ({
    command: invocationPath(name, schema),
    category: schema.category,
    description: descriptions[name] ?? "",
    params: Object.keys(schema.params),
  }));
}

function detail(name: string, descriptions: Record<string, string>) {
  const schema = ALL[name];
  if (!schema) return { success: false as const, error: `Unknown command: "${name}"` };
  return {
    success: true as const,
    data: {
      command: invocationPath(name, schema),
      category: schema.category,
      description: descriptions[name] ?? "",
      params: toParamsJsonSchema(schema.params),
      output: schema.output,
    },
  };
}

export function buildSchemaHandler(descriptions: Record<string, string>): CommandHandler {
  return async (args, _values, fmt) => {
    if (args.length === 0) {
      output({ success: true, data: listAll(descriptions) }, fmt);
      return;
    }
    const name = args[0] === "trade" && args[1] ? args[1] : args[0];
    output(detail(name, descriptions), fmt);
  };
}
