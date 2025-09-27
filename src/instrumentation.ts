import { tryCatch } from '@igniter-js/core'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const payment = await import('@/modules/billing/services/payment').then(
      (mod) => mod.payment,
    )
    await tryCatch(payment.sync())
  }
}
