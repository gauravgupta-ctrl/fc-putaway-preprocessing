'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import type { TransferOrderLineWithSku, PreprocessingStatus } from '@/types/database';
import {
  requestPreprocessing,
  cancelPreprocessing,
  requestAllPreprocessing,
  cancelAllPreprocessing,
} from '@/lib/database';

interface TransferOrderItemsTableProps {
  data: TransferOrderLineWithSku[];
  userId: string | null;
  onUpdate: () => void;
  threshold: number;
}

function getStatusColor(status: PreprocessingStatus): string {
  switch (status) {
    case 'not required':
      return 'bg-gray-100 text-gray-800';
    case 'in review':
      return 'bg-yellow-100 text-yellow-800';
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

export function TransferOrderItemsTable({
  data,
  userId,
  onUpdate,
  threshold,
}: TransferOrderItemsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'days_of_stock', desc: true }, // Default: highest DOS first
  ]);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleRequest(itemId: string) {
    setLoading(itemId);
    try {
      await requestPreprocessing(itemId, userId);
      await onUpdate();
    } catch (error) {
      console.error('Error requesting preprocessing:', error);
      alert('Failed to request preprocessing');
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel(itemId: string) {
    setLoading(itemId);
    try {
      await cancelPreprocessing(itemId, userId);
      await onUpdate();
    } catch (error) {
      console.error('Error canceling preprocessing:', error);
      alert('Failed to cancel preprocessing');
    } finally {
      setLoading(null);
    }
  }

  async function handleRequestAll() {
    const eligibleItems = data
      .filter((item) => item.preprocessing_status === 'in review')
      .map((item) => item.id);

    if (eligibleItems.length === 0) {
      alert('No items available for pre-processing request');
      return;
    }

    setLoading('all');
    try {
      await requestAllPreprocessing(eligibleItems, userId);
      await onUpdate();
    } catch (error) {
      console.error('Error requesting all:', error);
      alert('Failed to request all');
    } finally {
      setLoading(null);
    }
  }

  async function handleCancelAll() {
    const eligibleItems = data
      .filter((item) => item.preprocessing_status === 'requested')
      .map((item) => item.id);

    if (eligibleItems.length === 0) {
      alert('No requested items to cancel');
      return;
    }

    setLoading('all');
    try {
      await cancelAllPreprocessing(eligibleItems, userId);
      await onUpdate();
    } catch (error) {
      console.error('Error canceling all:', error);
      alert('Failed to cancel all');
    } finally {
      setLoading(null);
    }
  }

  const columns = useMemo<ColumnDef<TransferOrderLineWithSku>[]>(
    () => [
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
        accessorKey: 'sku',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              SKU
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => <div className="font-mono text-sm">{row.getValue('sku')}</div>,
      },
      {
        accessorKey: 'sku_data.barcode',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Barcode
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const skuData = row.original.sku_data;
          return skuData?.barcode ? (
            <div className="font-mono text-sm text-gray-700">{skuData.barcode}</div>
          ) : (
            '-'
          );
        },
      },
      {
        accessorKey: 'sku_data.description',
        header: 'Description',
        cell: ({ row }) => {
          const skuData = row.original.sku_data;
          return skuData?.description || '-';
        },
      },
      {
        accessorKey: 'units_incoming',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Qty Incoming
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const qty = row.getValue('units_incoming') as number;
          return qty?.toLocaleString() || '-';
        },
      },
      {
        id: 'days_of_stock',
        accessorFn: (row) => row.sku_data?.days_of_stock_pickface || 0,
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Days of Stock in Pick Face
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const dos = row.original.sku_data?.days_of_stock_pickface || 0;
          const exceeds = dos > threshold;
          return (
            <div className="flex items-center gap-2">
              <span className={exceeds ? 'font-semibold text-orange-600' : ''}>
                {dos.toFixed(1)} days
              </span>
              {exceeds && <Badge variant="outline" className="text-xs">Above threshold</Badge>}
            </div>
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
              Status
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
          const itemId = row.original.id;
          const isLoading = loading === itemId;

          if (status === 'in review') {
            return (
              <Button
                size="sm"
                onClick={() => handleRequest(itemId)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request'}
              </Button>
            );
          } else if (status === 'requested') {
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCancel(itemId)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel'}
              </Button>
            );
          } else {
            return <span className="text-gray-400 text-sm">-</span>;
          }
        },
      },
    ],
    [threshold, loading, userId]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const inReviewCount = data.filter((item) => item.preprocessing_status === 'in review').length;
  const requestedCount = data.filter((item) => item.preprocessing_status === 'requested').length;

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleRequestAll}
          disabled={inReviewCount === 0 || loading === 'all'}
        >
          {loading === 'all' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Request All ({inReviewCount})
        </Button>
        <Button
          variant="outline"
          onClick={handleCancelAll}
          disabled={requestedCount === 0 || loading === 'all'}
        >
          {loading === 'all' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Cancel All Requests ({requestedCount})
        </Button>
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
                  <TableRow key={row.id}>
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
                    No items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {table.getRowModel().rows.length} item(s) • {inReviewCount} in review •{' '}
        {requestedCount} requested
      </div>
    </div>
  );
}

