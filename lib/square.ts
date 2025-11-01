import { Environment, SquareClient } from "square";
import { env } from "./env";

const environmentMap: Record<typeof env.SQUARE_ENV, Environment> = {
  sandbox: Environment.Sandbox,
  production: Environment.Production,
};

export const squareClient = new SquareClient({
  accessToken: env.SQUARE_ACCESS_TOKEN,
  environment: environmentMap[env.SQUARE_ENV],
});
