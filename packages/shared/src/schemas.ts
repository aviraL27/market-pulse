import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  category: z.string().trim().max(50).optional(),
  source: z.enum(["crypto", "food", "fx", "commodity", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const productIdSchema = z.object({
  id: z.string().min(1).max(200),
});

export const watchlistBodySchema = z.object({
  product_id: z.string().min(1).max(200),
});

export const recordSearchSchema = z.object({
  term: z.string().trim().min(1).max(100),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(12),
  offset: z.coerce.number().int().min(0).default(0),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatar: z.string().url().max(500).optional().nullable(),
});
