'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Plus, Trash2, LogOut } from 'lucide-react';
import {
  getThreshold,
  updateThreshold,
  getEligibleMerchants,
  addEligibleMerchant,
  updateMerchantDestination,
  removeEligibleMerchant,
} from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { EligibleMerchant } from '@/types/database';
import { CSVUpload } from '@/components/CSVUpload';

export default function SettingsPage() {
  const router = useRouter();
  const [threshold, setThreshold] = useState(30);
  const [merchants, setMerchants] = useState<EligibleMerchant[]>([]);
  const [newMerchant, setNewMerchant] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [editingMerchant, setEditingMerchant] = useState<string | null>(null);
  const [editDestination, setEditDestination] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<{ message: string; stats: any } | null>(null);

  useEffect(() => {
    loadData();
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [thresholdValue, merchantsList] = await Promise.all([
        getThreshold(),
        getEligibleMerchants(),
      ]);
      setThreshold(thresholdValue);
      setMerchants(merchantsList);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleThresholdChange(value: number[]) {
    setThreshold(value[0]);
  }

  async function saveThreshold() {
    setSaving(true);
    try {
      await updateThreshold(threshold, userId);
      alert('Threshold updated successfully');
    } catch (error) {
      console.error('Error saving threshold:', error);
      alert('Failed to save threshold');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMerchant() {
    if (!newMerchant.trim()) return;

    try {
      await addEligibleMerchant(newMerchant.trim(), newDestination.trim() || null, userId);
      setNewMerchant('');
      setNewDestination('');
      await loadData();
    } catch (error) {
      console.error('Error adding merchant:', error);
      alert('Failed to add merchant. It may already exist.');
    }
  }

  async function handleUpdateDestination(merchantId: string) {
    try {
      await updateMerchantDestination(merchantId, editDestination.trim() || null, userId);
      setEditingMerchant(null);
      setEditDestination('');
      await loadData();
    } catch (error) {
      console.error('Error updating destination:', error);
      alert('Failed to update destination');
    }
  }

  async function handleRemoveMerchant(merchant: EligibleMerchant) {
    if (!confirm(`Remove ${merchant.merchant_name} from eligible merchants?`)) return;

    try {
      await removeEligibleMerchant(merchant.id, merchant.merchant_name, userId);
      await loadData();
    } catch (error) {
      console.error('Error removing merchant:', error);
      alert('Failed to remove merchant');
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout');
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
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600">Configure pre-processing rules and data synchronization</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* CSV Upload Section */}
      <div className="mb-6">
        <CSVUpload 
          userId={userId} 
          onUploadComplete={loadData}
          externalSuccess={uploadSuccess}
          onSuccessChange={setUploadSuccess}
        />
      </div>

      {/* Days of Stock Threshold */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Days of Stock Threshold</CardTitle>
          <CardDescription>
            Items with more than this many days of stock in the pick face will be flagged for
            pre-processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="threshold">Threshold: {threshold} days</Label>
              <Slider
                id="threshold"
                min={1}
                max={60}
                step={1}
                value={[threshold]}
                onValueChange={handleThresholdChange}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                Range: 1 - 60 days. Items with days of stock above this threshold will be considered
                for shelf storage.
              </p>
            </div>
            <Button onClick={saveThreshold} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Threshold'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Eligible Merchants */}
      <Card>
        <CardHeader>
          <CardTitle>Eligible Merchants</CardTitle>
          <CardDescription>
            Only these merchants can be subject to pre-processing. Other merchants will always go to
            ASRS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Merchant */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Merchant name"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Reserve storage zone (optional)"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMerchant();
                  }}
                  className="flex-1"
                />
                <Button onClick={handleAddMerchant} disabled={!newMerchant.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {/* Merchant List */}
            <div className="border rounded-md divide-y">
              {merchants.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No merchants configured. Add merchants that can be subject to pre-processing.
                </div>
              ) : (
                merchants.map((merchant) => (
                  <div key={merchant.id} className="p-3">
                    {editingMerchant === merchant.id ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium min-w-[150px]">{merchant.merchant_name}</span>
                        <Input
                          placeholder="Reserve storage zone"
                          value={editDestination}
                          onChange={(e) => setEditDestination(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateDestination(merchant.id);
                            if (e.key === 'Escape') setEditingMerchant(null);
                          }}
                          className="text-sm flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleUpdateDestination(merchant.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingMerchant(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="font-medium min-w-[150px]">{merchant.merchant_name}</span>
                          <span className="text-sm text-gray-600">
                            {merchant.reserve_destination || 'No zone set'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMerchant(merchant.id);
                              setEditDestination(merchant.reserve_destination || '');
                            }}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMerchant(merchant)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

