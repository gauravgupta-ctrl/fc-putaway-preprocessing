'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { getTransferOrders, getTransferOrderLines, getThreshold, getEligibleMerchants } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { TransferOrder, TransferOrderLineWithSku } from '@/types/database';
import { TransferOrdersTable } from '@/components/TransferOrdersTable';
import { TransferOrderItemsTable } from '@/components/TransferOrderItemsTable';

export default function DashboardPage() {
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([]);
  const [selectedTOs, setSelectedTOs] = useState<string[]>([]);
  const [items, setItems] = useState<TransferOrderLineWithSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(30);

  useEffect(() => {
    loadData();
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedTOs.length > 0) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [selectedTOs]);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [tos, thresholdValue] = await Promise.all([
        getTransferOrders(),
        getThreshold(),
      ]);
      setTransferOrders(tos);
      setThreshold(thresholdValue);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadItems() {
    setLoadingItems(true);
    try {
      const itemsData = await getTransferOrderLines(selectedTOs);
      setItems(itemsData as TransferOrderLineWithSku[]);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoadingItems(false);
    }
  }

  async function handleRefresh() {
    // Recalculate statuses based on current threshold
    await fetch('/api/recalculate-status', { method: 'POST' });
    
    await loadData();
    if (selectedTOs.length > 0) {
      await loadItems();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transfer Orders Dashboard</h1>
          <p className="text-gray-600">
            Review and manage pre-processing for incoming transfer orders
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Current threshold: <Badge variant="outline">{threshold} days</Badge>
          </p>
        </div>
        <Button onClick={handleRefresh}>
          <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Transfer Orders Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transfer Orders</CardTitle>
          <CardDescription>
            Select transfer orders to review items and request pre-processing to direct high-stock items to shelf storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransferOrdersTable
            data={transferOrders}
            selectedTOs={selectedTOs}
            onSelectionChange={setSelectedTOs}
          />
        </CardContent>
      </Card>

      {/* Transfer Order Items Table */}
      {selectedTOs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Items in Selected Transfer Order{selectedTOs.length > 1 ? 's' : ''}
            </CardTitle>
            <CardDescription>
              Review items with high days of stock and request pre-processing to redirect them to shelf storage. Items above the {threshold}-day threshold are highlighted. Use "Request" to mark items for operator pre-processing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingItems ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <TransferOrderItemsTable
                data={items}
                userId={userId}
                onUpdate={handleRefresh}
                threshold={threshold}
              />
            )}
          </CardContent>
        </Card>
      )}

      {selectedTOs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Select one or more transfer orders above to view items
          </CardContent>
        </Card>
      )}
    </div>
  );
}

