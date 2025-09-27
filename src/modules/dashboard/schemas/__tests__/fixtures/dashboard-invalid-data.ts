/**
 * Invalid test fixtures for dashboard schemas
 * These represent incorrect data structures that should fail validation
 */

/**
 * Invalid chart data points - various validation failures
 */
export const invalidChartDataPoints = [
  {
    // Missing required 'date' field
    current: 1000,
    previous: 900,
  },
  {
    // Invalid date format
    date: '01-01-2024',
    current: 1000,
    previous: 900,
  },
  {
    // Invalid date format (not ISO)
    date: 'January 1, 2024',
    current: 1000,
    previous: 900,
  },
  {
    // Invalid types for numeric fields
    date: '2024-01-01',
    current: '1000',
    previous: 'not-a-number',
  },
  {
    // Date in wrong type
    date: 20240101,
    current: 1000,
    previous: 900,
  },
]

/**
 * Invalid metric data - various validation failures
 */
export const invalidMetricData = [
  {
    // Missing required 'value' field
    change: 10,
    trend: 'up',
    description: 'Missing value',
    subtext: 'Invalid',
  },
  {
    // Invalid 'trend' value
    value: 1000,
    change: 10,
    trend: 'sideways', // Should be 'up' or 'down'
    description: 'Invalid trend',
    subtext: 'Test',
  },
  {
    // Wrong type for 'value'
    value: 'not-a-number',
    change: 10,
    trend: 'up',
    description: 'Invalid value type',
    subtext: 'Test',
  },
  {
    // Missing multiple required fields
    value: 1000,
    // Missing: change, trend, description, subtext
  },
  {
    // Wrong type for 'change'
    value: 1000,
    change: '10%',
    trend: 'up',
    description: 'Invalid change type',
    subtext: 'Test',
  },
]

/**
 * Invalid dashboard metrics - missing or wrong fields
 */
export const invalidDashboardMetrics = [
  {
    // Missing required 'totalSales' field
    itemsSold: {
      value: 100,
      change: 5,
      trend: 'up',
      description: 'Items',
      subtext: 'Sold',
    },
    orders: {
      value: 50,
      change: 2,
      trend: 'down',
      description: 'Orders',
      subtext: 'Total',
    },
    averageTicket: {
      value: 200,
      change: 10,
      trend: 'up',
      description: 'Ticket',
      subtext: 'Average',
    },
  },
  {
    // Wrong structure - not an object
    totalSales: 'invalid',
    itemsSold: 'invalid',
    orders: 'invalid',
    averageTicket: 'invalid',
  },
  {
    // Extra fields that shouldn't exist
    totalSales: {
      value: 1000,
      change: 10,
      trend: 'up',
      description: 'Sales',
      subtext: 'Total',
      extraField: 'should-not-be-here',
    },
    itemsSold: {
      value: 100,
      change: 5,
      trend: 'up',
      description: 'Items',
      subtext: 'Sold',
    },
    orders: {
      value: 50,
      change: 2,
      trend: 'down',
      description: 'Orders',
      subtext: 'Total',
    },
    averageTicket: {
      value: 200,
      change: 10,
      trend: 'up',
      description: 'Ticket',
      subtext: 'Average',
    },
    unexpectedMetric: {
      value: 999,
      change: 0,
      trend: 'up',
      description: 'Unknown',
      subtext: 'Metric',
    },
  },
]

/**
 * Invalid shipping difference data
 */
export const invalidShippingDifference = [
  {
    // Missing required 'value' field
    currency: 'BRL',
    trend: 'positive',
    description: 'Missing value',
  },
  {
    // Invalid 'trend' value
    value: 1000,
    currency: 'BRL',
    trend: 'increasing', // Should be 'positive', 'negative', or 'neutral'
    description: 'Invalid trend',
  },
  {
    // Wrong type for 'value'
    value: '1000',
    currency: 'BRL',
    trend: 'positive',
    description: 'Invalid value type',
  },
  {
    // Missing all required fields
    someField: 'invalid',
  },
  {
    // Wrong type for entire object
    value: null,
    currency: null,
    trend: null,
    description: null,
  },
]

/**
 * Invalid complete dashboard data
 */
export const invalidCompleteDashboardData = [
  {
    // Missing required 'chartData' field
    metrics: {},
    financialMetrics: {},
    shippingDifference: {},
  },
  {
    // Wrong type for 'chartData' (not an array)
    chartData: 'not-an-array',
    metrics: {},
    financialMetrics: {},
    shippingDifference: {},
  },
  {
    // Completely wrong structure
    data: {
      nested: {
        wrongly: true,
      },
    },
  },
  {
    // Null values where objects expected
    chartData: null,
    metrics: null,
    financialMetrics: null,
    shippingDifference: null,
  },
  {
    // Undefined values
    chartData: undefined,
    metrics: undefined,
    financialMetrics: undefined,
    shippingDifference: undefined,
  },
]

/**
 * Edge cases that might break validation
 */
export const edgeCaseInvalidData = [
  // Empty object
  {},
  // Null
  null,
  // Undefined
  undefined,
  // Array instead of object
  [],
  // String
  'invalid',
  // Number
  12345,
  // Boolean
  true,
  // Function (should never happen but good to test)
  () => {},
  // Symbol
  Symbol('invalid'),
  // NaN
  NaN,
  // Infinity
  Infinity,
  // Very large numbers that might overflow
  {
    value: Number.MAX_SAFE_INTEGER + 1,
    change: Number.MAX_VALUE,
    trend: 'up',
    description: 'Overflow test',
    subtext: 'Edge case',
  },
]
