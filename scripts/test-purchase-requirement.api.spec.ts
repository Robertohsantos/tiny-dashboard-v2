import { test, expect } from '@playwright/test'

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const ORG_ID = process.env.API_ORG_ID || 'mock-org-123'

function apiUrl(path: string) {
  return new URL(path, BASE_URL).toString()
}

test.describe('Purchase Requirement API', () => {
  test('simulate scenarios', async ({ request }) => {
    const response = await request.post(apiUrl('/api/products/purchase-requirement/simulate'), {
      data: {
        organizationId: ORG_ID,
        scenarios: [
          {
            name: 'Baseline',
            coverageDays: 30,
            leadTimeStrategy: 'P50',
            includeStockReserve: true,
          },
          {
            name: 'Aggressive',
            coverageDays: 45,
            leadTimeStrategy: 'P90',
            includeStockReserve: true,
          },
        ],
        compareResults: true,
      },
    })

    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json?.success).toBeTruthy()
    expect(json?.data?.scenarios).toBeTruthy()
  })

  test('risk endpoint', async ({ request }) => {
    const response = await request.get(
      apiUrl('/api/products/purchase-requirement/risk?organizationId=' + ORG_ID + '&threshold=0.5'),
    )

    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json?.success).toBeTruthy()
    expect(Array.isArray(json?.data)).toBeTruthy()
  })

  test('validate supplier constraints', async ({ request }) => {
    const response = await request.post(apiUrl('/api/products/purchase-requirement/validate'), {
      data: {
        supplier: 'SUP-001',
        orders: [
          { sku: 'SKU-001', quantity: 10 },
          { sku: 'SKU-002', quantity: 5 },
        ],
      },
    })

    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json?.success).toBeTruthy()
    expect(json?.data).toBeTruthy()
  })
})