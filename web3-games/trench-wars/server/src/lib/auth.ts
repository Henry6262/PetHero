import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { Account } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

export interface AuthRequest extends Request {
  account?: Account
}

export function createRequireAuth(prisma: PrismaClient, cookieSecret: string): RequestHandler {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const signed = req.signedCookies?.trench_account as string | undefined
      if (!signed) {
        res.status(401).json({ error: 'unauthorized' })
        return
      }

      const account = await prisma.account.findUnique({ where: { id: signed } })
      if (!account) {
        res.status(401).json({ error: 'unauthorized' })
        return
      }

      req.account = account
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function setAccountCookie(res: Response, accountId: string, cookieSecret: string) {
  res.cookie('trench_account', accountId, {
    signed: true,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === 'production',
  })
}
