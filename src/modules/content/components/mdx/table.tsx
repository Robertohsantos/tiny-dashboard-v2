import React from 'react'
import { cn } from '@/modules/ui'

type TableProps = React.DetailedHTMLProps<
  React.TableHTMLAttributes<HTMLTableElement>,
  HTMLTableElement
>
type TheadProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLTableSectionElement>,
  HTMLTableSectionElement
>
type TbodyProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLTableSectionElement>,
  HTMLTableSectionElement
>
type TrProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLTableRowElement>,
  HTMLTableRowElement
>
type ThProps = React.DetailedHTMLProps<
  React.ThHTMLAttributes<HTMLTableHeaderCellElement>,
  HTMLTableHeaderCellElement
>
type TdProps = React.DetailedHTMLProps<
  React.TdHTMLAttributes<HTMLTableDataCellElement>,
  HTMLTableDataCellElement
>

export function Table({ children, ...props }: TableProps) {
  return (
    <div className="my-8 w-full overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-background" {...props}>
          {children}
        </table>
      </div>
    </div>
  )
}

export function TableHead({ children, ...props }: TheadProps) {
  return (
    <thead className="bg-muted/50" {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ children, ...props }: TbodyProps) {
  return (
    <tbody className="[&_tr:last-child]:border-0" {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, ...props }: TrProps) {
  return (
    <tr
      className="border-b border-border transition-colors hover:bg-muted/30"
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHeader({ children, ...props }: ThProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-semibold text-foreground',
        '[&:has([role=checkbox])]:pr-0',
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, ...props }: TdProps) {
  return (
    <td
      className="p-4 align-middle text-foreground/80 [&:has([role=checkbox])]:pr-0"
      {...props}
    >
      {children}
    </td>
  )
}
