import { z } from "zod";

const envSchema = z.object({
  SQUARE_ACCESS_TOKEN: z
    .string({ required_error: "SQUARE_ACCESS_TOKEN is required" })
    .min(1, "SQUARE_ACCESS_TOKEN is required"),
  SQUARE_ENV: z.enum(["sandbox", "production"], {
    errorMap: () => ({ message: "SQUARE_ENV must be either 'sandbox' or 'production'" }),
  }),
  SQUARE_LOCATION_ID: z
    .string({ required_error: "SQUARE_LOCATION_ID is required" })
    .min(1, "SQUARE_LOCATION_ID is required"),
  BASE_URL: z
    .string({ required_error: "BASE_URL is required" })
    .url("BASE_URL must be a valid URL"),
});

const parsed = envSchema.safeParse({
  SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
  SQUARE_ENV: process.env.SQUARE_ENV,
  SQUARE_LOCATION_ID: process.env.SQUARE_LOCATION_ID,
  BASE_URL: process.env.BASE_URL,
});

if (!parsed.success) {
  const errorMessages = parsed.error.errors.map((error) => `${error.path.join(".") || "env"}: ${error.message}`);
  throw new Error(`Invalid environment configuration:\n${errorMessages.join("\n")}`);
}

export const env = parsed.data;
export type Env = typeof env;
