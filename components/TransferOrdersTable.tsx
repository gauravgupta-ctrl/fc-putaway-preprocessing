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
import { ArrowUpDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TransferOrder, PreprocessingStatus } from '@/types/database';
import { format } from 'date-fns';
import { generateTransferCSVs } from '@/lib/transferCSV';
import { toggleAdminReviewed } from '@/lib/database';

interface TransferOrdersTableProps {
  data: TransferOrder[];
  selectedTOs: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onReviewClick?: (to: TransferOrder) => void;
  userId: string | null;
  onUpdate: () => void;
  reviewedOverrides: Map<string, boolean>;
  onReviewedChange: (toId: string, reviewed: boolean) => void;
}

function getStatusColor(status: PreprocessingStatus): string {
  switch (status) {
    case 'not needed':
      return 'bg-gray-100 text-gray-800';
    case 'requested':
      return 'bg-blue-100 text-blue-800';
    case 'partially completed':
      return 'bg-yellow-100 text-yellow-800';
    case 'not completed':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in-progress':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function TransferOrdersTable({ data, selectedTOs, onSelectionChange, onReviewClick, userId, onUpdate, reviewedOverrides, onReviewedChange }: TransferOrdersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'estimated_arrival', desc: true }, // Default: newest first
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [downloadingTOs, setDownloadingTOs] = useState<Set<string>>(new Set());
  const [updatingReviewed, setUpdatingReviewed] = useState<string | null>(null);

  async function handleToggleReviewed(toId: string, transferNumber: string, checked: boolean) {
    console.log('Toggling reviewed for TO:', transferNumber, 'ID:', toId, 'New value:', checked);
    
    if (updatingReviewed) {
      console.log('Already updating another TO, ignoring');
      return;
    }
    
    setUpdatingReviewed(toId);
    
    // Optimistically update via parent's shared state
    onReviewedChange(toId, checked);
    
    try {
      await toggleAdminReviewed(toId, checked, userId);
    } catch (error) {
      console.error('Error toggling admin reviewed:', error);
      alert('Failed to update review status. Please try again.');
      // On error, revert the optimistic update
      onReviewedChange(toId, !checked);
    } finally {
      setUpdatingReviewed(null);
    }
  }

  async function handleCreateTransfers(to: TransferOrder, e: React.MouseEvent) {
    e.stopPropagation();
    
    if (downloadingTOs.has(to.id)) return;

    const storageZone = (to as any).reserve_destination || 'Reserve';
    
    setDownloadingTOs(prev => new Set(prev).add(to.id));
    
    try {
      await generateTransferCSVs(to.id, to.transfer_number, to.merchant, storageZone);
      
      // Keep button disabled for 5 seconds
      setTimeout(() => {
        setDownloadingTOs(prev => {
          const newSet = new Set(prev);
          newSet.delete(to.id);
          return newSet;
        });
      }, 5000);
    } catch (error) {
      console.error('Error generating transfer CSVs:', error);
      alert('Failed to generate transfer files. Please try again.');
      setDownloadingTOs(prev => {
        const newSet = new Set(prev);
        newSet.delete(to.id);
        return newSet;
      });
    }
  }

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
              className="h-auto p-0"
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
              className="h-auto p-0"
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
              className="h-auto p-0"
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
              className="h-auto p-0"
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
              className="h-auto p-0"
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
              className="h-auto p-0"
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
              className="h-auto p-0"
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
          const isDownloading = downloadingTOs.has(row.original.id);
          return (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewClick?.(row.original);
                }}
              >
                Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleCreateTransfers(row.original, e)}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-900 border-t-transparent mr-1"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3 mr-1" />
                    Create Transfers
                  </>
                )}
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'reviewed',
        header: 'Transfers Created?',
        cell: ({ row }) => {
          const status = row.original.preprocessing_status;
          if (status !== 'completed') return null;
          const to = row.original;
          const isUpdating = updatingReviewed === to.id;
          // Use override if exists, otherwise use the original value
          const isReviewed = reviewedOverrides.has(to.id) ? reviewedOverrides.get(to.id)! : to.admin_reviewed;
          return (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex items-center justify-center"
            >
              <Checkbox
                id={`reviewed-${to.id}`}
                checked={isReviewed}
                disabled={isUpdating}
                onCheckedChange={(checked) => {
                  console.log('Checkbox clicked for:', to.transfer_number, 'Current value:', isReviewed, 'New value:', checked);
                  handleToggleReviewed(to.id, to.transfer_number, !!checked);
                }}
                aria-label={`Mark ${to.transfer_number} as reviewed`}
              />
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [onReviewClick, downloadingTOs, updatingReviewed, reviewedOverrides]
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
                      <TableCell key={cell.id} className="align-middle">
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

