'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TransferOrder, PreprocessingStatus } from '@/types/database';
import { format } from 'date-fns';

interface TransferOrdersTableProps {
  data: TransferOrder[];
  selectedTOs: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onReviewClick?: (to: TransferOrder) => void;
}

function getStatusColor(status: PreprocessingStatus): string {
  switch (status) {
    case 'not needed':
      return 'bg-gray-100 text-gray-800';
    case 'requested':
      return 'bg-blue-100 text-blue-800';
    case 'in-progress':
      return 'bg-purple-100 text-purple-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function TransferOrdersTable({ data, selectedTOs, onSelectionChange, onReviewClick }: TransferOrdersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'estimated_arrival', desc: true }, // Default: newest first
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo<ColumnDef<TransferOrder>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'transfer_number',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Transfer #
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('transfer_number')}</div>,
      },
      {
        accessorKey: 'merchant',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Merchant
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
      },
      {
        accessorKey: 'transfer_status',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Transfer Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const status = row.getValue('transfer_status') as string;
          return status ? <Badge variant="outline">{status}</Badge> : '-';
        },
      },
      {
        accessorKey: 'estimated_arrival',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Est. Arrival
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = row.getValue('estimated_arrival') as string;
          return date ? format(new Date(date), 'MMM dd, yyyy') : '-';
        },
      },
      {
        accessorKey: 'receipt_time',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Receipt Time
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = row.getValue('receipt_time') as string;
          return date ? format(new Date(date), 'MMM dd, yyyy HH:mm') : '-';
        },
      },
      {
        accessorKey: 'destination',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Destination
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
      },
      {
        accessorKey: 'preprocessing_status',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Pre-processing Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const status = row.getValue('preprocessing_status') as PreprocessingStatus;
          return <Badge className={getStatusColor(status)}>{status}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const status = row.original.preprocessing_status;
          if (status !== 'completed') return null;
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onReviewClick?.(row.original);
              }}
            >
              Review
            </Button>
          );
        },
        enableSorting: false,
      },
    ],
    [onReviewClick]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === 'function'
          ? updater(
              selectedTOs.reduce((acc, id) => ({ ...acc, [id]: true }), {} as Record<string, boolean>)
            )
          : updater;

      const selectedIds = Object.keys(newSelection).filter((key) => newSelection[key]);
      onSelectionChange(selectedIds);
    },
    state: {
      sorting,
      columnFilters,
      rowSelection: selectedTOs.reduce((acc, id) => ({ ...acc, [id]: true }), {} as Record<string, boolean>),
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Filter by Transfer #..."
          value={(table.getColumn('transfer_number')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('transfer_number')?.setFilterValue(event.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by Merchant..."
          value={(table.getColumn('merchant')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('merchant')?.setFilterValue(event.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by Destination..."
          value={(table.getColumn('destination')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('destination')?.setFilterValue(event.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Selection Info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected
        </div>
      </div>
    </div>
  );
}

