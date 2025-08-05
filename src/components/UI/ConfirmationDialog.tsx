import React from 'react';
import { X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonColor?: 'red' | 'green' | 'blue';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmButtonText,
  cancelButtonText,
  onConfirm,
  onCancel,
  confirmButtonColor = 'red'
}) => {
  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    const baseClasses = "px-4 py-2 rounded-lg text-white transition-colors";
    
    switch (confirmButtonColor) {
      case 'green':
        return `${baseClasses} bg-green-600 hover:bg-green-700`;
      case 'blue':
        return `${baseClasses} bg-blue-600 hover:bg-blue-700`;
      case 'red':
      default:
        return `${baseClasses} bg-red-600 hover:bg-red-700`;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      style={{
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        style={{
          animation: 'slideDown 0.3s ease-out',
        }}
      >
        <div className="flex justify-between items-center p-4 border-b rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-6">{message}</p>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {cancelButtonText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={getConfirmButtonClass()}
            >
              {confirmButtonText}
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-50px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
  );
};

export default ConfirmationDialog;
