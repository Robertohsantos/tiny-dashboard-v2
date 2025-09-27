/**
 * Integration tests for ChartAreaInteractive component
 * Tests complex chart rendering, interactions, and data processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChartAreaInteractive } from '../chart-area-interactive'
import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'
import type { PeriodType } from '@/modules/dashboard/utils/period-utils'

// Mock Recharts components to avoid rendering issues in tests
vi.mock('recharts', () => ({
  Area: vi.fn(({ children, ...props }) => (
    <div data-testid="area" {...props}>
      {children}
    </div>
  )),
  AreaChart: vi.fn(({ children, ...props }) => (
    <div data-testid="area-chart" {...props}>
      {children}
    </div>
  )),
  CartesianGrid: vi.fn((props) => (
    <div data-testid="cartesian-grid" {...props} />
  )),
  XAxis: vi.fn((props) => <div data-testid="x-axis" {...props} />),
  ResponsiveContainer: vi.fn(({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  )),
}))

// Mock chart utilities
vi.mock('@/modules/dashboard/utils/chart', () => ({
  applyProjections: vi.fn((data, periodType) => {
    // Add projection data for last 3 points
    return data.map((point, index) => {
      if (index >= data.length - 3) {
        return {
          ...point,
          projection: point.current * 1.1, // 10% growth projection
        }
      }
      return point
    })
  }),
  debugLog: vi.fn(),
}))

// Mock chart formatters
vi.mock('@/modules/dashboard/utils/chart-formatters', () => ({
  formatXAxisTick: vi.fn((value, periodType) => {
    const date = new Date(value)
    if (periodType === 'today') return date.getHours() + ':00'
    if (periodType === 'week')
      return date.toLocaleDateString('pt-BR', { weekday: 'short' })
    if (periodType === 'month') return date.getDate().toString()
    return date.toLocaleDateString('pt-BR', { month: 'short' })
  }),
  getTickInterval: vi.fn((periodType) => {
    if (periodType === 'today') return 2
    if (periodType === 'week') return 0
    if (periodType === 'month') return 4
    return 'preserveStartEnd'
  }),
  getTickFontSize: vi.fn((periodType) => {
    if (periodType === 'today') return 11
    if (periodType === 'week') return 12
    return 12
  }),
  formatTooltipLabel: vi.fn((value) => {
    return new Date(value).toLocaleDateString('pt-BR')
  }),
}))

describe('ChartAreaInteractive - Integration Tests', () => {
  const mockData: ChartDataPoint[] = [
    {
      date: '2024-01-01',
      current: 5000,
      previous: 4500,
      twoPeriodsBefore: 4000,
    },
    {
      date: '2024-01-02',
      current: 5500,
      previous: 4800,
      twoPeriodsBefore: 4200,
    },
    {
      date: '2024-01-03',
      current: 6000,
      previous: 5000,
      twoPeriodsBefore: 4500,
    },
    {
      date: '2024-01-04',
      current: 6500,
      previous: 5200,
      twoPeriodsBefore: 4700,
    },
    {
      date: '2024-01-05',
      current: 7000,
      previous: 5500,
      twoPeriodsBefore: 5000,
    },
  ]

  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render with chart data', () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      // Check card structure
      expect(screen.getByText('Comparação de Vendas')).toBeInTheDocument()
      expect(screen.getByText('Mês atual vs anterior')).toBeInTheDocument()

      // Check chart components
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    })

    it('should render empty state when no data', () => {
      render(<ChartAreaInteractive data={[]} periodType="month" />)

      expect(
        screen.getByText('Nenhum dado disponível para o período'),
      ).toBeInTheDocument()
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
    })

    it('should render responsive description based on screen size', () => {
      const { container } = render(
        <ChartAreaInteractive data={mockData} periodType="month" />,
      )

      // Check both descriptions exist in DOM
      const fullDescription = container.querySelector('.sm\\:block.hidden')
      const shortDescription = container.querySelector('.sm\\:hidden')

      expect(fullDescription).toBeInTheDocument()
      expect(shortDescription).toBeInTheDocument()
    })
  })

  describe('Period Type Handling', () => {
    const periodTypes: PeriodType[] = ['today', 'week', 'month', 'year']

    it.each(periodTypes)('should handle %s period correctly', (periodType) => {
      const { applyProjections } = require('@/modules/dashboard/utils/chart')

      render(<ChartAreaInteractive data={mockData} periodType={periodType} />)

      // Verify projections were applied with correct period
      expect(applyProjections).toHaveBeenCalledWith(mockData, periodType)

      // Verify formatters use correct period
      const {
        getTickInterval,
        getTickFontSize,
      } = require('@/modules/dashboard/utils/chart-formatters')
      expect(getTickInterval).toHaveBeenCalledWith(periodType)
      expect(getTickFontSize).toHaveBeenCalledWith(periodType)
    })

    it('should update chart when period changes', () => {
      const { rerender } = render(
        <ChartAreaInteractive data={mockData} periodType="month" />,
      )
      const { applyProjections } = require('@/modules/dashboard/utils/chart')

      expect(applyProjections).toHaveBeenCalledWith(mockData, 'month')

      // Change period
      rerender(<ChartAreaInteractive data={mockData} periodType="week" />)

      expect(applyProjections).toHaveBeenCalledWith(mockData, 'week')
    })
  })

  describe('Toggle Third Period', () => {
    it('should toggle third period data on button click', async () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      const button = screen.getByRole('button', {
        name: /mostrar 2 períodos atrás/i,
      })
      expect(button).toBeInTheDocument()

      // Initially, third period area should not be rendered
      const areas = screen.getAllByTestId('area')
      expect(areas).toHaveLength(3) // current, previous, projection

      // Click to show third period
      await user.click(button)

      // Button text should change
      expect(
        screen.getByRole('button', { name: /ocultar 2 períodos atrás/i }),
      ).toBeInTheDocument()

      // Should have 4 areas now
      const updatedAreas = screen.getAllByTestId('area')
      expect(updatedAreas).toHaveLength(4) // current, previous, projection, twoPeriodsBefore
    })

    it('should maintain toggle state across re-renders', async () => {
      const { rerender } = render(
        <ChartAreaInteractive data={mockData} periodType="month" />,
      )

      // Toggle to show third period
      const button = screen.getByRole('button', {
        name: /mostrar 2 períodos atrás/i,
      })
      await user.click(button)

      expect(
        screen.getByRole('button', { name: /ocultar 2 períodos atrás/i }),
      ).toBeInTheDocument()

      // Re-render with same props
      rerender(<ChartAreaInteractive data={mockData} periodType="month" />)

      // Toggle state should be maintained
      expect(
        screen.getByRole('button', { name: /ocultar 2 períodos atrás/i }),
      ).toBeInTheDocument()
    })
  })

  describe('Data Processing and Projections', () => {
    it('should apply projections to chart data', () => {
      const { applyProjections } = require('@/modules/dashboard/utils/chart')

      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      expect(applyProjections).toHaveBeenCalledWith(mockData, 'month')
      expect(applyProjections).toHaveBeenCalledTimes(1)
    })

    it('should handle empty data without errors', () => {
      const { applyProjections } = require('@/modules/dashboard/utils/chart')

      render(<ChartAreaInteractive data={[]} periodType="month" />)

      // Should not call applyProjections for empty data
      expect(applyProjections).not.toHaveBeenCalled()
    })

    it('should handle data with missing values', () => {
      const incompleteData: ChartDataPoint[] = [
        { date: '2024-01-01', current: 5000, previous: 0 },
        { date: '2024-01-02', current: 0, previous: 4800 },
        { date: '2024-01-03', current: 6000, previous: undefined as any },
      ]

      const { applyProjections } = require('@/modules/dashboard/utils/chart')

      render(<ChartAreaInteractive data={incompleteData} periodType="month" />)

      expect(applyProjections).toHaveBeenCalledWith(incompleteData, 'month')
    })
  })

  describe('Memoization and Performance', () => {
    it('should not re-render when props are the same', () => {
      const { applyProjections } = require('@/modules/dashboard/utils/chart')

      const { rerender } = render(
        <ChartAreaInteractive data={mockData} periodType="month" />,
      )

      expect(applyProjections).toHaveBeenCalledTimes(1)

      // Re-render with same props
      rerender(<ChartAreaInteractive data={mockData} periodType="month" />)

      // Should not process data again due to memoization
      expect(applyProjections).toHaveBeenCalledTimes(1)
    })

    it('should re-render when data changes', () => {
      const { applyProjections } = require('@/modules/dashboard/utils/chart')

      const { rerender } = render(
        <ChartAreaInteractive data={mockData} periodType="month" />,
      )

      const newData = [
        ...mockData,
        { date: '2024-01-06', current: 7500, previous: 6000 },
      ]

      rerender(<ChartAreaInteractive data={newData} periodType="month" />)

      // Should process new data
      expect(applyProjections).toHaveBeenCalledTimes(2)
      expect(applyProjections).toHaveBeenLastCalledWith(newData, 'month')
    })

    it('should re-render when periodType changes', () => {
      const { applyProjections } = require('@/modules/dashboard/utils/chart')

      const { rerender } = render(
        <ChartAreaInteractive data={mockData} periodType="month" />,
      )

      rerender(<ChartAreaInteractive data={mockData} periodType="week" />)

      // Should process data with new period
      expect(applyProjections).toHaveBeenCalledTimes(2)
      expect(applyProjections).toHaveBeenLastCalledWith(mockData, 'week')
    })
  })

  describe('Debug Logging', () => {
    it('should log debug information in development', () => {
      const { debugLog } = require('@/modules/dashboard/utils/chart')

      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      // Should log initial data info
      expect(debugLog).toHaveBeenCalledWith(
        'ChartAreaInteractive received data for month',
        expect.objectContaining({
          length: mockData.length,
          firstDate: mockData[0].date,
          lastDate: mockData[mockData.length - 1].date,
        }),
      )

      // Should log processed data info
      expect(debugLog).toHaveBeenCalledWith(
        'Processed data for month',
        expect.objectContaining({
          originalLength: mockData.length,
          processedLength: expect.any(Number),
          hasProjections: true,
        }),
      )
    })
  })

  describe('Chart Configuration', () => {
    it('should apply correct configuration for each period type', () => {
      const {
        getTickInterval,
        getTickFontSize,
      } = require('@/modules/dashboard/utils/chart-formatters')

      render(<ChartAreaInteractive data={mockData} periodType="today" />)

      expect(getTickInterval).toHaveBeenCalledWith('today')
      expect(getTickFontSize).toHaveBeenCalledWith('today')

      // Verify tick interval is applied
      const xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('interval', '2')
    })

    it('should apply gradient configurations', () => {
      const { container } = render(
        <ChartAreaInteractive data={mockData} periodType="month" />,
      )

      // Check gradients are defined
      const gradients = container.querySelectorAll('linearGradient')
      expect(gradients).toHaveLength(3) // current, previous, twoPeriodsBefore

      // Check gradient IDs
      expect(container.querySelector('#colorCurrent')).toBeInTheDocument()
      expect(container.querySelector('#colorPrevious')).toBeInTheDocument()
      expect(
        container.querySelector('#colorTwoPeriodsBefore'),
      ).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName(/mostrar 2 períodos atrás/i)
    })

    it('should handle keyboard navigation', async () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      const button = screen.getByRole('button')

      // Focus the button
      button.focus()
      expect(button).toHaveFocus()

      // Trigger with Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /ocultar 2 períodos atrás/i }),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid date formats gracefully', () => {
      const invalidData: ChartDataPoint[] = [
        { date: 'invalid-date', current: 5000, previous: 4500 },
        { date: '2024-13-45', current: 5500, previous: 4800 }, // Invalid date
        { date: '', current: 6000, previous: 5000 }, // Empty date
      ]

      expect(() => {
        render(<ChartAreaInteractive data={invalidData} periodType="month" />)
      }).not.toThrow()
    })

    it('should handle negative values', () => {
      const negativeData: ChartDataPoint[] = [
        { date: '2024-01-01', current: -5000, previous: 4500 },
        { date: '2024-01-02', current: 5500, previous: -4800 },
      ]

      render(<ChartAreaInteractive data={negativeData} periodType="month" />)

      // Should render without crashing
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })

  describe('Large Dataset Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Generate large dataset
      const largeData: ChartDataPoint[] = Array.from(
        { length: 365 },
        (_, i) => ({
          date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
          current: 5000 + Math.random() * 2000,
          previous: 4500 + Math.random() * 1500,
        }),
      )

      const startTime = performance.now()
      render(<ChartAreaInteractive data={largeData} periodType="year" />)
      const endTime = performance.now()

      // Should render within reasonable time (< 500ms)
      expect(endTime - startTime).toBeLessThan(500)

      // Chart should be rendered
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })
})
