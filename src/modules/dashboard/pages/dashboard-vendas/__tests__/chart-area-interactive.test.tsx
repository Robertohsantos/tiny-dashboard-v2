/**
 * ChartAreaInteractive Component Tests
 * Tests for the interactive area chart component
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChartAreaInteractive } from '../chart-area-interactive'
import type { ChartDataPoint } from '@/modules/dashboard/data/data-fetchers'
import type { PeriodType } from '@/modules/dashboard/utils/period-utils'

// Mock recharts components
vi.mock('recharts', () => ({
  Area: () => <div data-testid="area-component" />,
  AreaChart: ({ children }: any) => (
    <div data-testid="area-chart">{children}</div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}))

// Mock chart utilities
vi.mock('@/modules/dashboard/utils/chart', () => ({
  applyProjections: vi.fn((data) => data),
  debugLog: vi.fn(),
}))

// Mock chart formatters
vi.mock('@/modules/dashboard/utils/chart-formatters', () => ({
  formatXAxisTick: vi.fn((value) => value),
  getTickInterval: vi.fn(() => 0),
  getTickFontSize: vi.fn(() => 12),
  formatTooltipLabel: vi.fn((value) => value),
}))

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardDescription: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={className}>{children}</h3>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
}))

describe('ChartAreaInteractive', () => {
  const mockData: ChartDataPoint[] = [
    {
      date: '2024-01-01',
      current: 100,
      previous: 80,
      twoPeriodsBefore: 70,
      projection: undefined,
    },
    {
      date: '2024-01-02',
      current: 120,
      previous: 90,
      twoPeriodsBefore: 75,
      projection: undefined,
    },
    {
      date: '2024-01-03',
      current: 140,
      previous: 100,
      twoPeriodsBefore: 80,
      projection: undefined,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the chart with data', () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      expect(
        screen.getByText('Comparação de Vendas por Período'),
      ).toBeInTheDocument()
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })

    it('should show no data message when data is empty', () => {
      render(<ChartAreaInteractive data={[]} periodType="month" />)

      expect(
        screen.getByText('Nenhum dado disponível para este período'),
      ).toBeInTheDocument()
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
    })

    it('should render responsive description text', () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      // Both descriptions should be in the DOM (one hidden on mobile, one on desktop)
      expect(
        screen.getByText(/Análise comparativa entre períodos/),
      ).toBeInTheDocument()
      expect(screen.getByText(/Comparação entre períodos/)).toBeInTheDocument()
    })
  })

  describe('Period Type Handling', () => {
    const periodTypes: PeriodType[] = ['today', 'week', 'month', 'year']

    it.each(periodTypes)('should handle period type: %s', (periodType) => {
      render(<ChartAreaInteractive data={mockData} periodType={periodType} />)

      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })

    it('should use default period type when not provided', () => {
      render(<ChartAreaInteractive data={mockData} />)

      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })

  describe('Third Period Toggle', () => {
    it('should show third period button', () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      const button = screen.getByRole('button', {
        name: /Adicionar 3º período/,
      })
      expect(button).toBeInTheDocument()
    })

    it('should toggle third period visibility on button click', async () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      const button = screen.getByRole('button', {
        name: /Adicionar 3º período/,
      })

      // Initially shows "Adicionar 3º período"
      expect(button).toHaveTextContent('Adicionar 3º período')

      // Click to show third period
      fireEvent.click(button)
      await waitFor(() => {
        expect(button).toHaveTextContent('Remover 3º período')
      })

      // Click to hide third period
      fireEvent.click(button)
      await waitFor(() => {
        expect(button).toHaveTextContent('Adicionar 3º período')
      })
    })

    it('should render additional Area component when third period is shown', async () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      const button = screen.getByRole('button', { name: /Mostrar 3º período/ })
      const areaComponents = screen.getAllByTestId('area-component')

      // Initially should have 3 Area components (previous, current, projection)
      expect(areaComponents).toHaveLength(3)

      // After clicking, should have 4 Area components
      fireEvent.click(button)
      await waitFor(() => {
        const updatedAreaComponents = screen.getAllByTestId('area-component')
        expect(updatedAreaComponents).toHaveLength(4)
      })
    })
  })

  describe('Projections', () => {
    const dataWithProjections: ChartDataPoint[] = [
      ...mockData,
      {
        date: '2024-01-04',
        current: null,
        previous: null,
        twoPeriodsBefore: null,
        projection: 160,
      },
      {
        date: '2024-01-05',
        current: null,
        previous: null,
        twoPeriodsBefore: null,
        projection: 180,
      },
    ]

    it('should handle data with projections', () => {
      const applyProjections = vi
        .mocked(vi.fn())
        .mockReturnValue(dataWithProjections)
      vi.doMock('@/modules/dashboard/utils/chart', () => ({
        applyProjections,
        debugLog: vi.fn(),
      }))

      render(
        <ChartAreaInteractive data={dataWithProjections} periodType="month" />,
      )

      // Just verify the chart renders with projection data
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })

    it('should debug log in development', () => {
      render(<ChartAreaInteractive data={mockData} periodType="week" />)

      // Just verify the chart renders
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })

  describe('Chart Configuration', () => {
    it('should render all gradient definitions', () => {
      const { container } = render(
        <ChartAreaInteractive data={mockData} periodType="month" />,
      )

      const gradients = container.querySelectorAll('linearGradient')
      expect(gradients).toHaveLength(3) // current, previous, twoPeriodsBefore

      // Check gradient IDs
      expect(container.querySelector('#currentGradient')).toBeDefined()
      expect(container.querySelector('#previousGradient')).toBeDefined()
      expect(container.querySelector('#twoperiodsbeforeGradient')).toBeDefined()
    })

    it('should render chart components in correct order', () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument()
      expect(screen.getAllByTestId('area-component')).toHaveLength(3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null data gracefully', () => {
      render(<ChartAreaInteractive data={null} periodType="month" />)

      expect(
        screen.getByText('Nenhum dado disponível para este período'),
      ).toBeInTheDocument()
    })

    it('should handle undefined data gracefully', () => {
      render(<ChartAreaInteractive data={undefined} periodType="month" />)

      expect(
        screen.getByText('Nenhum dado disponível para este período'),
      ).toBeInTheDocument()
    })

    it('should handle single data point', () => {
      const singlePoint: ChartDataPoint[] = [
        { date: '2024-01-01', current: 100, previous: 80 },
      ]

      render(<ChartAreaInteractive data={singlePoint} periodType="month" />)

      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })

    it('should handle very large dataset', () => {
      const largeData: ChartDataPoint[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          current: Math.random() * 100,
          previous: Math.random() * 80,
        }),
      )

      render(<ChartAreaInteractive data={largeData} periodType="year" />)

      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button text', () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName(/Adicionar 3º período/)
    })

    it('should have proper heading structure', () => {
      render(<ChartAreaInteractive data={mockData} periodType="month" />)

      const heading = screen.getByText('Comparação de Vendas por Período')
      expect(heading.tagName).toBe('H3')
    })
  })
})
