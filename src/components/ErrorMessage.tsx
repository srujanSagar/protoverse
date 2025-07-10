import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900/50 rounded-full p-3 w-16 h-16 mx-auto mb-4">
          <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connection Error</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </button>
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Setup Required:</strong> Please click "Connect to Supabase" in the top right to configure your database connection.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;