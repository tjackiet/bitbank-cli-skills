import { z } from "zod";

export const TradeLogRecordSchema = z.object({
  timestamp: z.string().datetime(),
  command: z.string(),
  params: z.record(z.unknown()),
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export type TradeLogRecord = z.infer<typeof TradeLogRecordSchema>;
