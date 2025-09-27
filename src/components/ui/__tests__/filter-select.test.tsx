/**
 * FilterSelect Component Tests
 * Unit tests for the generic filter select component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterSelect, type FilterOption } from '../filter-select'

describe('FilterSelect Component', () => {
  const mockOptions: FilterOption[] = [
    { value: 'all', label: 'All Items' },
    { value: 'option1', label: 'Option 1', color: '#FF0000' },
    { value: 'option2', label: 'Option 2', icon: <>📦</> },
    { value: 'option3', label: 'Option 3', count: 5, disabled: true },
  ]

  const defaultProps = {
    value: 'all',
    onValueChange: jest.fn(),
    options: mockOptions,
    label: 'Test Filter',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with label when showLabel is true', () => {
      render(<FilterSelect {...defaultProps} showLabel={true} />)
      expect(screen.getByText('Test Filter:')).toBeInTheDocument()
    })

    it('should not render label when showLabel is false', () => {
      render(<FilterSelect {...defaultProps} showLabel={false} />)
      expect(screen.queryByText('Test Filter:')).not.toBeInTheDocument()
    })

    it('should render with correct placeholder', () => {
      render(
        <FilterSelect {...defaultProps} value="" placeholder="Choose option" />,
      )
      expect(screen.getByText('Choose option')).toBeInTheDocument()
    })

    it('should render loading state', () => {
      render(<FilterSelect {...defaultProps} isLoading={true} />)
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-busy', 'true')
    })

    it('should render disabled state', () => {
      render(<FilterSelect {...defaultProps} disabled={true} />)
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    })

    it('should apply size classes correctly', () => {
      const { rerender } = render(<FilterSelect {...defaultProps} size="sm" />)
      expect(screen.getByRole('combobox')).toHaveClass('w-[140px]')

      rerender(<FilterSelect {...defaultProps} size="lg" />)
      expect(screen.getByRole('combobox')).toHaveClass('w-[220px]')
    })
  })

  describe('Accessibility', () => {
    it('should have correct ARIA labels', () => {
      render(<FilterSelect {...defaultProps} ariaLabel="Custom ARIA label" />)
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-label',
        'Custom ARIA label',
      )
    })

    it('should associate label with select using aria-labelledby', () => {
      render(<FilterSelect {...defaultProps} showLabel={true} />)
      const select = screen.getByRole('combobox')
      const labelId = select.getAttribute('aria-labelledby')
      expect(labelId).toBeTruthy()
      const label = document.getElementById(labelId!)
      expect(label?.textContent).toContain('Test Filter')
    })

    it('should have unique IDs for multiple instances', () => {
      const { container } = render(
        <>
          <FilterSelect {...defaultProps} />
          <FilterSelect {...defaultProps} label="Another Filter" />
        </>,
      )
      const selects = container.querySelectorAll('[role="combobox"]')
      const ids = Array.from(selects).map((s) => s.id)
      expect(ids[0]).not.toBe(ids[1])
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<FilterSelect {...defaultProps} />)

      const select = screen.getByRole('combobox')
      await user.tab()
      expect(select).toHaveFocus()
    })
  })

  describe('Functionality', () => {
    it('should call onValueChange when selection changes', async () => {
      const onValueChange = jest.fn()
      render(<FilterSelect {...defaultProps} onValueChange={onValueChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.click(select)

      await waitFor(() => {
        const option = screen.getByText('Option 1')
        fireEvent.click(option)
      })

      expect(onValueChange).toHaveBeenCalledWith('option1')
    })

    it('should not allow selection of disabled options', async () => {
      const onValueChange = jest.fn()
      render(<FilterSelect {...defaultProps} onValueChange={onValueChange} />)

      const select = screen.getByRole('combobox')
      fireEvent.click(select)

      await waitFor(() => {
        const disabledOption = screen.getByText('Option 3')
        expect(disabledOption.closest('[aria-disabled="true"]')).toBeTruthy()
      })
    })

    it('should display selected option correctly', () => {
      render(<FilterSelect {...defaultProps} value="option1" />)
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    it('should show empty state when no options', () => {
      render(<FilterSelect {...defaultProps} options={[]} />)
      const select = screen.getByRole('combobox')
      fireEvent.click(select)

      waitFor(() => {
        expect(screen.getByText('Nenhuma opção disponível')).toBeInTheDocument()
      })
    })
  })

  describe('Visual Features', () => {
    it('should render option with color indicator', () => {
      render(<FilterSelect {...defaultProps} value="option1" />)
      const colorIndicator = document.querySelector(
        '[style*="background-color"]',
      )
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#FF0000' })
    })

    it('should render option with icon', () => {
      render(<FilterSelect {...defaultProps} value="option2" />)
      expect(screen.getByText('📦')).toBeInTheDocument()
    })

    it('should render option counts when showCounts is true', () => {
      const optionsWithCounts = mockOptions.map((opt) => ({
        ...opt,
        count: 10,
      }))
      render(
        <FilterSelect
          {...defaultProps}
          options={optionsWithCounts}
          showCounts={true}
        />,
      )

      const select = screen.getByRole('combobox')
      fireEvent.click(select)

      waitFor(() => {
        const badges = screen.getAllByText('10')
        expect(badges.length).toBeGreaterThan(0)
      })
    })

    it('should render trigger icon when provided', () => {
      const TriggerIcon = () => <span data-testid="trigger-icon">🔍</span>
      render(<FilterSelect {...defaultProps} triggerIcon={<TriggerIcon />} />)
      expect(screen.getByTestId('trigger-icon')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should memoize selected option', () => {
      const { rerender } = render(
        <FilterSelect {...defaultProps} value="option1" />,
      )
      const initialOption = screen.getByText('Option 1')

      // Rerender with same props
      rerender(<FilterSelect {...defaultProps} value="option1" />)
      const afterRerender = screen.getByText('Option 1')

      expect(initialOption).toBe(afterRerender)
    })
  })
})
