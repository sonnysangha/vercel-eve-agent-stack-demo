import { z } from "zod";

export const primitiveValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export type PrimitiveValue = z.infer<typeof primitiveValue>;
export type InputRow = Record<string, PrimitiveValue>;
