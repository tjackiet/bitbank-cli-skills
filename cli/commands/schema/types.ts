import { z } from "zod";

const ParamPropSchema = z.object({
  type: z.string(),
  description: z.string(),
  enum: z.array(z.string()).optional(),
  default: z.unknown().optional(),
});

export const SchemaDefSchema = z.object({
  category: z.enum(["public", "private", "trade", "stream"]),
  params: z.record(ParamPropSchema),
  output: z.record(z.unknown()),
});

export type ParamProp = z.infer<typeof ParamPropSchema>;
export type SchemaDef = z.infer<typeof SchemaDefSchema>;

/** Shorthand: p(type, description) or p(type, description, { enum, default }) */
export function p(
  type: string,
  description: string,
  extra?: { enum?: string[]; default?: unknown },
): ParamProp {
  return {
    type,
    description,
    ...(extra?.enum ? { enum: extra.enum } : {}),
    ...(extra?.default !== undefined ? { default: extra.default } : {}),
  };
}
