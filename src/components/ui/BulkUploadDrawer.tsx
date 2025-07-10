import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Loader2, ArrowDown, RotateCcw } from 'lucide-react';

interface ValidationError {
  row: number;
  column: string;
  message: string;
  type: 'missing' | 'format' | 'reference' | 'business';
}

interface BulkUploadDrawerProps {
  isOpen: boolean;
  entityType: string;
  entityPlural: string;
  expectedHeaders: string[];
  sampleData: Record<string, any>[];
  onClose: () => void;
  onUpload: (data: any[]) => Promise<boolean>;
  validateRow?: (row: any, index: number) => ValidationError[];
  requiredHeaders: string[];
}

const BulkUploadDrawer: React.FC<BulkUploadDrawerProps> = ({
  isOpen,
  entityType,
  entityPlural,
  expectedHeaders,
  sampleData,
  onClose,
  onUpload,
  validateRow,
  requiredHeaders
}) => {
  const [uploadState, setUploadState] = useState<'idle' | 'parsing' | 'validating' | 'uploading' | 'success' | 'error'>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showCTAs, setShowCTAs] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle scroll to show/hide CTAs
  React.useEffect(() => {
    const handleScroll = () => {
      if (drawerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = drawerRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setShowCTAs(isAtBottom);
      }
    };

    const drawerElement = drawerRef.current;
    if (drawerElement) {
      drawerElement.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => drawerElement.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen, uploadState]);

  // Reset state when drawer opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setUploadState('idle');
      setFile(null);
      setParsedData([]);
      setErrors([]);
      setShowCTAs(false);
    }
  }, [isOpen]);

  const generateSampleCSV = () => {
    const headers = expectedHeaders.join(',');
    const rows = sampleData.map(row => 
      expectedHeaders.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  };

  const downloadSample = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType.toLowerCase()}-sample.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
    
    return data;
  };

  const validateData = (data: any[]): ValidationError[] => {
    const validationErrors: ValidationError[] = [];
    
    // Check headers
    if (data.length > 0) {
      const fileHeaders = Object.keys(data[0]);
      const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));
      
      if (missingHeaders.length > 0) {
        validationErrors.push({
          row: 0,
          column: 'headers',
          message: `Missing required columns: ${missingHeaders.join(', ')}`,
          type: 'missing'
        });
      }
    }
    
    // Validate each row
    data.forEach((row, index) => {
      // Check required fields
      requiredHeaders.forEach(header => {
        if (!row[header] || row[header].toString().trim() === '') {
          validationErrors.push({
            row: index + 2, // +2 because row 1 is headers and we're 0-indexed
            column: header,
            message: `Column "${header}" is required`,
            type: 'missing'
          });
        }
      });
      
      // Custom validation if provided
      if (validateRow) {
        const customErrors = validateRow(row, index + 2);
        validationErrors.push(...customErrors);
      }
    });
    
    return validationErrors;
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;
    
    // Validate file type
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      setErrors([{
        row: 0,
        column: 'file',
        message: 'Only CSV and XLSX files are supported',
        type: 'format'
      }]);
      setUploadState('error');
      return;
    }
    
    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrors([{
        row: 0,
        column: 'file',
        message: 'File size must be less than 5MB',
        type: 'format'
      }]);
      setUploadState('error');
      return;
    }
    
    setFile(selectedFile);
    setUploadState('parsing');
    
    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);
      setParsedData(data);
      
      setUploadState('validating');
      
      // Simulate validation delay
      setTimeout(() => {
        const validationErrors = validateData(data);
        setErrors(validationErrors);
        setUploadState(validationErrors.length > 0 ? 'error' : 'success');
      }, 1000);
      
    } catch (error) {
      setErrors([{
        row: 0,
        column: 'file',
        message: 'Failed to parse file. Please check the format.',
        type: 'format'
      }]);
      setUploadState('error');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleReUpload = () => {
    setUploadState('idle');
    setFile(null);
    setParsedData([]);
    setErrors([]);
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (parsedData.length === 0 || errors.length > 0) return;
    
    setUploadState('uploading');
    
    try {
      const success = await onUpload(parsedData);
      if (success) {
        setUploadState('success');
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setUploadState('error');
        setErrors([{
          row: 0,
          column: 'upload',
          message: 'Failed to upload data. Please try again.',
          type: 'business'
        }]);
      }
    } catch (error) {
      setUploadState('error');
      setErrors([{
        row: 0,
        column: 'upload',
        message: 'Upload failed. Please try again.',
        type: 'business'
      }]);
    }
  };

  const getErrorsByType = () => {
    const grouped = errors.reduce((acc, error) => {
      if (!acc[error.type]) acc[error.type] = [];
      acc[error.type].push(error);
      return acc;
    }, {} as Record<string, ValidationError[]>);
    
    return grouped;
  };

  const getStateIcon = () => {
    switch (uploadState) {
      case 'parsing':
      case 'validating':
      case 'uploading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Upload className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStateMessage = () => {
    switch (uploadState) {
      case 'parsing':
        return 'Analyzing your file...';
      case 'validating':
        return `Checking ${parsedData.length} records...`;
      case 'uploading':
        return 'Uploading data...';
      case 'success':
        return `✅ All ${parsedData.length} records valid!`;
      case 'error':
        return `⚠️ Fix ${errors.length} issues to continue`;
      default:
        return 'Upload a CSV file to get started';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-3xl bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Bulk Upload {entityPlural}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload a CSV file to update all records. Existing data will be replaced.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div ref={drawerRef} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Download Sample Section */}
            <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Step 1: Download Sample CSV
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Use our template to ensure your data is formatted correctly.
              </p>
              <button
                onClick={downloadSample}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </button>
            </div>

            {/* Upload Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Step 2: Upload Your File
              </h3>
              
              {/* Upload Zone - Always keep grey styling */}
              {uploadState === 'idle' ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/50'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <Upload className="h-5 w-5 text-gray-400" />
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Upload a CSV file to get started
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Drag and drop your file here, or click to browse
                      </p>
                    </div>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      Browse Files
                    </button>
                  </div>
                </div>
              ) : (
                /* File uploaded state - show file info with re-upload option */
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    {getStateIcon()}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getStateMessage()}
                      </p>
                    </div>
                    
                    {file && (
                      <div className="flex items-center justify-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <FileText className="h-4 w-4" />
                          <span>{file.name}</span>
                          <span>({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          onClick={handleReUpload}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Re-upload
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Supported formats: CSV, XLSX (max 5MB)
              </p>
            </div>

            {/* Error Reporting - Only border, no background fill */}
            {errors.length > 0 && (
              <div className="rounded-lg border-2 border-red-300 dark:border-red-600">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-red-900 dark:text-red-300 mb-3">
                    Issues Found ({errors.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(getErrorsByType()).map(([type, typeErrors]) => (
                      <details key={type} className="group" open>
                        <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200">
                          {type === 'missing' && `❌ ${typeErrors.length} missing values`}
                          {type === 'format' && `⚠️ ${typeErrors.length} format errors`}
                          {type === 'reference' && `🔗 ${typeErrors.length} reference errors`}
                          {type === 'business' && `📋 ${typeErrors.length} business rule violations`}
                        </summary>
                        <div className="mt-2 ml-4 space-y-1">
                          {typeErrors.map((error, index) => (
                            <div key={index} className="text-sm text-red-700 dark:text-red-300">
                              {error.row > 0 ? `Row ${error.row}, Column "${error.column}": ` : ''}
                              {error.message}
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {uploadState === 'success' && errors.length === 0 && (
              <div className="bg-green-50 dark:bg-green-900/50 rounded-lg border border-green-200 dark:border-green-700 p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-sm font-medium text-green-900 dark:text-green-300">
                    Ready to Upload
                  </h3>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  All {parsedData.length} records are valid and ready to be uploaded.
                </p>
                
                {/* Warning about replacement */}
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded border border-yellow-200 dark:border-yellow-700">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ This will replace ALL current {entityPlural.toLowerCase()} with {parsedData.length} new records.
                  </p>
                </div>
              </div>
            )}

            {/* Spacer for scroll */}
            <div className="h-32"></div>
          </div>
        </div>

        {/* Scroll Indicator */}
        {!showCTAs && uploadState !== 'idle' && (
          <div className="absolute bottom-24 left-8 bg-blue-600 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1 animate-bounce">
            <span>Scroll to continue</span>
            <ArrowDown className="h-3 w-3" />
          </div>
        )}

        {/* Fixed CTAs */}
        <div className={`border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 transition-all duration-300 ${
          showCTAs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
        }`}>
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploadState !== 'success' || errors.length > 0 || parsedData.length === 0}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {uploadState === 'uploading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Replace ${parsedData.length} Records`
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkUploadDrawer;