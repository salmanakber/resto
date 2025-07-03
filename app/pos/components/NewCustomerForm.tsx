import { useEffect, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Customer } from '../types';

interface NewCustomerFormProps {
  phone: string;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
  isDarkMode: boolean;
  isCustomerSaving: boolean;
}

export default function NewCustomerForm({ phone, onSave, onCancel, isDarkMode, isCustomerSaving }: NewCustomerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      id: Date.now().toString(),
      phone,
      ...formData,
    });
    
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow`}>
      <h3 className="text-lg font-semibold mb-4">New Customer Registration</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Phone Number
          </label>
          <input
            type="text"
            value={phone}
            className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-800"
          />
        </div>
        <div className="mb-4">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-800"
          />
        </div>
        <div className="mb-4">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-800"
          />
        </div>
        <div className="mb-6">
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-800"
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-rose-500 text-white py-2 rounded-md text-sm font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
          >
            Save
            <ArrowRight className="w-4 h-4 text-white" />
            {isCustomerSaving && <Loader2 className="w-4 h-4 text-white animate-spin" />}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 