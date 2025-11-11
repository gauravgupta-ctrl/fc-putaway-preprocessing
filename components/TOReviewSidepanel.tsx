'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { TransferOrder } from '@/types/database';
import { format } from 'date-fns';
import { generateTransferCSVs } from '@/lib/transferCSV';
import { toggleAdminReviewed } from '@/lib/database';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PalletAssignment {
  id: string;
  pallet_number: number;
  sku: string;
  quantity: number;
  carton_count: number;
  sku_description?: string;
}

interface ExpectedQuantity {
  sku: string;
  expected: number;
  sku_description?: string;
}

interface TOReviewSidepanelProps {
  transferOrder: TransferOrder;
  onClose: () => void;
  userId: string | null;
  onUpdate: () => void;
  reviewedOverrides: Map<string, boolean>;
  onReviewedChange: (toId: string, reviewed: boolean) => void;
}

export function TOReviewSidepanel({ transferOrder, onClose, userId, onUpdate, reviewedOverrides, onReviewedChange }: TOReviewSidepanelProps) {
  const [palletAssignments, setPalletAssignments] = useState<PalletAssignment[]>([]);
  const [expectedQuantities, setExpectedQuantities] = useState<ExpectedQuantity[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [isUpdatingReviewed, setIsUpdatingReviewed] = useState(false);

  // Use override if exists, otherwise use the original value
  const reviewed = reviewedOverrides.has(transferOrder.id) 
    ? reviewedOverrides.get(transferOrder.id)! 
    : transferOrder.admin_reviewed;

  useEffect(() => {
    loadData();
  }, [transferOrder.id]);

  async function handleToggleReviewed(checked: boolean) {
    if (isUpdatingReviewed) return;
    
    setIsUpdatingReviewed(true);
    
    // Optimistically update via parent's shared state
    onReviewedChange(transferOrder.id, checked);
    
    try {
      await toggleAdminReviewed(transferOrder.id, checked, userId);
      // Don't call onUpdate() to avoid re-fetching data and potential side effects
    } catch (error) {
      console.error('Error toggling admin reviewed:', error);
      alert('Failed to update review status. Please try again.');
      // On error, revert the optimistic update
      onReviewedChange(transferOrder.id, !checked);
    } finally {
      setIsUpdatingReviewed(false);
    }
  }

  async function handleCreateTransfers() {
    if (downloading) return;

    const storageZone = (transferOrder as any).reserve_destination || 'Reserve';
    
    setDownloading(true);
    
    try {
      await generateTransferCSVs(
        transferOrder.id,
        transferOrder.transfer_number,
        transferOrder.merchant,
        storageZone
      );
      
      // Keep button disabled for 5 seconds
      setTimeout(() => {
        setDownloading(false);
      }, 5000);
    } catch (error) {
      console.error('Error generating transfer CSVs:', error);
      alert('Failed to generate transfer files. Please try again.');
      setDownloading(false);
    }
  }

  async function loadData() {
    setLoading(true);
    
    // Load pallet assignments
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('pallet_assignments')
      .select(`
        id,
        pallet_number,
        sku,
        quantity,
        carton_count,
        sku_data:sku_attributes(description)
      `)
      .eq('transfer_order_id', transferOrder.id)
      .order('pallet_number', { ascending: true })
      .order('sku', { ascending: true });

    if (assignmentsData && !assignmentsError) {
      const assignments = assignmentsData.map((item: any) => ({
        id: item.id,
        pallet_number: item.pallet_number,
        sku: item.sku,
        quantity: item.quantity,
        carton_count: item.carton_count || 1,
        sku_description: item.sku_data?.description || '',
      }));
      setPalletAssignments(assignments);
    }

    // Load expected quantities from transfer order lines
    // Include all items that were requested for preprocessing (not just completed)
    const { data: linesData, error: linesError } = await supabase
      .from('transfer_order_lines')
      .select(`
        sku,
        units_incoming,
        preprocessing_status,
        sku_data:sku_attributes(description)
      `)
      .eq('transfer_order_id', transferOrder.id)
      .in('preprocessing_status', ['requested', 'partially completed', 'completed', 'not completed']);

    if (linesData && !linesError) {
      const expected = linesData.map((item: any) => ({
        sku: item.sku,
        expected: item.units_incoming || 0,
        sku_description: item.sku_data?.description || '',
      }));
      setExpectedQuantities(expected);
    }

    setLoading(false);
  }

  // Calculate totals
  const uniqueItems = new Set(palletAssignments.map((a) => a.sku)).size;
  const totalUnits = palletAssignments.reduce((sum, a) => sum + a.quantity, 0);
  const totalCartons = palletAssignments.reduce((sum, a) => sum + a.carton_count, 0);

  // Group by pallet number
  const palletGroups = palletAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.pallet_number]) {
      acc[assignment.pallet_number] = [];
    }
    acc[assignment.pallet_number].push(assignment);
    return acc;
  }, {} as Record<number, PalletAssignment[]>);

  // Calculate quantity variances by SKU
  // Show ALL requested items with variance (including those never touched)
  const quantityVariances = expectedQuantities.map((expected) => {
    const assigned = palletAssignments
      .filter((a) => a.sku === expected.sku)
      .reduce((sum, a) => sum + a.quantity, 0);
    const variance = assigned - expected.expected;
    return {
      sku: expected.sku,
      sku_description: expected.sku_description,
      expected: expected.expected,
      assigned,
      variance,
    };
  }).filter((v) => v.variance !== 0); // Show items that are over or under assigned

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sidepanel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Pre-processed Pallets</h2>
            <p className="text-sm text-gray-600 mt-1">Review pallet assignments and quantities for this transfer order</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="reviewed-checkbox"
                checked={reviewed}
                disabled={isUpdatingReviewed}
                onCheckedChange={(checked) => handleToggleReviewed(!!checked)}
              />
              <Label htmlFor="reviewed-checkbox" className="text-sm font-medium cursor-pointer">
                Reviewed
              </Label>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TO Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              {/* First row: Transfer Number, Merchant, empty, empty */}
              <div className="grid grid-cols-4 gap-x-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Transfer Number</p>
                  <p className="font-semibold text-gray-900">{transferOrder.transfer_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Merchant</p>
                  <p className="font-semibold text-gray-900">{transferOrder.merchant}</p>
                </div>
                <div></div>
                <div></div>
              </div>
              
              {/* Second row: Storage Zone, Unique Items, Total Units, Total Cartons */}
              <div className="grid grid-cols-4 gap-x-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Storage Zone</p>
                  <p className="font-semibold text-gray-900 text-xs">
                    Reserve{(transferOrder as any).reserve_destination ? ` - ${(transferOrder as any).reserve_destination}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Unique Items</p>
                  <p className="font-semibold text-gray-900">{uniqueItems}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Units</p>
                  <p className="font-semibold text-gray-900">{totalUnits.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Cartons</p>
                  <p className="font-semibold text-gray-900">{totalCartons.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quantity Variances */}
          {!loading && quantityVariances.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity Variances</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                {quantityVariances.map((variance) => (
                  <div
                    key={variance.sku}
                    className="flex items-center justify-between bg-white rounded px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-semibold text-xs text-gray-900">
                        {variance.sku}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {variance.sku_description || 'No description'}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-xs text-gray-600">
                        Expected: {variance.expected} • Assigned: {variance.assigned}
                      </p>
                      <p
                        className={`font-bold text-sm ${
                          variance.variance > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}
                      >
                        {variance.variance > 0 ? '+' : ''}{variance.variance} units
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pallet Assignments */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Pallet Assignments</h3>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-gray-900"></div>
              </div>
            ) : Object.keys(palletGroups).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No pallet assignments found
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(palletGroups)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([palletNumber, items]) => (
                    <div
                      key={palletNumber}
                      className="bg-white border rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-800 text-sm">
                          {palletNumber}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">Pallet {palletNumber}</p>
                          <p className="text-xs text-gray-600">
                            {items.length} item{items.length !== 1 ? 's' : ''} • {items.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()} units
                          </p>
                        </div>
                      </div>

                      {/* Items in this pallet */}
                      <div className="space-y-1.5">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-mono font-semibold text-xs text-gray-900">
                                {item.sku}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {item.sku_description || 'No description'}
                              </p>
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                              <p className="font-bold text-sm text-gray-900">{item.quantity} units</p>
                              <p className="text-[10px] text-gray-500">({item.carton_count} cartons)</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Create Transfers Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleCreateTransfers}
              disabled={downloading}
              size="lg"
              className="w-full"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating Transfers...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Create Transfers
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

