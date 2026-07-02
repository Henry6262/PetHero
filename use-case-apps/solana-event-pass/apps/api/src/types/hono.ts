import type { Context } from 'hono';

export interface UserVariables {
  user: {
    id: string;
    publicKey: string;
    role: string;
  };
}

export type AppContext = Context<{ Variables: UserVariables }>;
