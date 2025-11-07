'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { parseCSV, validateCSV, transformCSVData, uploadCSVData, type ValidationError } from '@/lib/csvUpload';

interface CSVUploadProps {
  userId: string | null;
  onUploadComplete: () => void;
}

export function CSVUpload({ userId, onUploadComplete }: CSVUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [success, setSuccess] = useState<{ message: string; stats: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setErrors([]);
    setSuccess(null);
    setUploading(true);

    try {
      // Read file
      const text = await file.text();
      
      // Parse CSV
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        setErrors([{ row: 0, field: 'file', message: 'No data rows found in CSV' }]);
        setUploading(false);
        return;
      }

      // Validate
      const validationErrors = validateCSV(rows);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setUploading(false);
        return;
      }

      // Transform data
      const data = transformCSVData(rows);

      // Upload to database
      const result = await uploadCSVData(data, userId);

      if (result.success) {
        setSuccess({ message: result.message, stats: result.stats });
        // Refresh data in background without clearing the success message
        onUploadComplete();
      } else {
        setErrors([{ row: 0, field: 'upload', message: result.message }]);
      }
    } catch (error) {
      console.error('CSV Upload Error:', error);
      setErrors([
        {
          row: 0,
          field: 'file',
          message: error instanceof Error ? error.message : 'Failed to process file',
        },
      ]);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const template = `transfer_number,merchant,estimated_arrival,receipt_time,destination,transfer_status,sku,units_incoming,sku_description,barcode,units_on_hand_pickface,average_daily_sales
T0101,Merchant A,2025-11-15,2025-11-15 14:30:00,Warehouse 1,Received,SKU-001,100,Widget A,123456789,500,20
T0101,Merchant A,2025-11-15,2025-11-15 14:30:00,Warehouse 1,Received,SKU-002,50,Widget B,987654321,900,20
T0102,Merchant B,2025-11-20,,Warehouse 2,In Transit,SKU-003,200,Gadget C,456789123,150,15`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transfer_orders_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import Data via CSV
        </CardTitle>
        <CardDescription>
          Upload transfer orders, items, and SKU data in bulk. Maximum 500 rows per upload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button and Template Download */}
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </Button>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold">✅ {success.message}</span>
                <span>📦 {success.stats.transferOrders} TOs</span>
                <span>📋 {success.stats.transferOrderLines} Items</span>
                <span>🏷️ {success.stats.skuAttributes} SKUs</span>
                <span className="text-xs text-green-700 italic ml-auto">Auto-request applied</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Upload failed with {errors.length} error(s):</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {errors.slice(0, 10).map((error, index) => (
                  <p key={index} className="text-sm">
                    {error.row > 0 ? `Row ${error.row}` : 'File'} - {error.field}: {error.message}
                  </p>
                ))}
                {errors.length > 10 && (
                  <p className="text-sm font-semibold mt-2">
                    ... and {errors.length - 10} more error(s)
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-semibold">CSV Format Requirements:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>All fields required except <code className="bg-gray-100 px-1 rounded">receipt_time</code></li>
            <li>Dates: <code className="bg-gray-100 px-1 rounded">YYYY-MM-DD</code> (e.g., 2025-11-15)</li>
            <li>Timestamps: <code className="bg-gray-100 px-1 rounded">YYYY-MM-DD HH:MM:SS</code> (e.g., 2025-11-15 14:30:00)</li>
            <li>Numeric fields must be positive numbers</li>
            <li>Existing records will be updated, new records will be added</li>
            <li>Manual preprocessing choices will be preserved</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

