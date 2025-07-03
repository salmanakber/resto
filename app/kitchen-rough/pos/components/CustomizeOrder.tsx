import { useState } from 'react';
import { MenuItem, OrderItem } from '../types';

interface CustomizeOrderProps {
  menuItem: MenuItem;
  onSave: (orderItem: Omit<OrderItem, 'id'>) => void;
  onCancel: () => void;
}

export default function CustomizeOrder({ menuItem, onSave, onCancel }: CustomizeOrderProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<{
    name: string;
    price: number;
  }[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleCustomizationToggle = (customization: { name: string; price: number }) => {
    setSelectedCustomizations((prev) => {
      const exists = prev.find((c) => c.name === customization.name);
      if (exists) {
        return prev.filter((c) => c.name !== customization.name);
      }
      return [...prev, customization];
    });
  };

  const handleSave = () => {
    onSave({
      menuItem,
      quantity,
      customizations: selectedCustomizations,
      specialInstructions: specialInstructions.trim() || undefined,
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{menuItem.name}</h3>
        <button onClick={onCancel} className="text-gray-500">
          ×
        </button>
      </div>

      {/* Quantity Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            -
          </button>
          <span className="text-lg font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Customizations */}
      {menuItem.customizations && menuItem.customizations.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customizations
          </label>
          <div className="space-y-2">
            {menuItem.customizations.map((customization) => (
              <label
                key={customization.name}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCustomizations.some(
                      (c) => c.name === customization.name
                    )}
                    onChange={() => handleCustomizationToggle(customization)}
                    className="mr-2"
                  />
                  <span>{customization.name}</span>
                </div>
                {customization.price > 0 && (
                  <span className="text-sm text-gray-500">
                    +${customization.price.toFixed(2)}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Special Instructions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Instructions
        </label>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Add any special instructions here..."
          className="w-full p-2 border rounded-lg"
          rows={3}
        />
      </div>

      {/* Total */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-lg font-medium">Total</span>
        <span className="text-lg font-medium text-rose-500">
          $
          {(
            (menuItem.price +
              selectedCustomizations.reduce((sum, c) => sum + c.price, 0)) *
            quantity
          ).toFixed(2)}
        </span>
      </div>

      {/* Add to Order Button */}
      <button
        onClick={handleSave}
        className="w-full bg-rose-500 text-white py-3 rounded-lg font-medium"
      >
        Add to Order
      </button>
    </div>
  );
} 