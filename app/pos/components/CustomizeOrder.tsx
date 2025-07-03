import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  services: {
    addon: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }[];
}

interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customizations?: {
    name: string;
    price: number;
  }[];
  specialInstructions?: string;
  isFree?: boolean;
  selectedAddons?: Array<{
    addon: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }>;
}

interface CustomizeOrderProps {
  menuItem: MenuItem;
  onSave: (orderItem: Omit<OrderItem, "id">) => void;
  onCancel: () => void;
  formatCurrency: (amount: number) => string;
}

const CustomizeOrder: React.FC<CustomizeOrderProps> = ({ menuItem, onSave, onCancel, formatCurrency }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Array<{
    addon: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }>>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleSave = () => {
    onSave({
      menuItem,
      quantity,
      isFree: false,
      selectedAddons,
      specialInstructions
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{menuItem.name}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Minus size={20} />
            </button>
            <span className="text-lg font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {menuItem.services && menuItem.services.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons</label>
            <div className="space-y-2">
              {menuItem.services.map((service) => (
                <div key={service.addon.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={service.addon.id}
                      checked={selectedAddons.some(a => a.addon.id === service.addon.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAddons([...selectedAddons, { addon: service.addon, quantity: 1 }]);
                        } else {
                          setSelectedAddons(selectedAddons.filter(a => a.addon.id !== service.addon.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={service.addon.id} className="text-sm">
                      {service.addon.name} ({formatCurrency(service.addon.price)})
                    </label>
                  </div>
                  {selectedAddons.some(a => a.addon.id === service.addon.id) && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAddons(selectedAddons.map(a => 
                            a.addon.id === service.addon.id 
                              ? { ...a, quantity: Math.max(1, a.quantity - 1) }
                              : a
                          ));
                        }}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-sm">
                        {selectedAddons.find(a => a.addon.id === service.addon.id)?.quantity || 1}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedAddons(selectedAddons.map(a => 
                            a.addon.id === service.addon.id 
                              ? { ...a, quantity: a.quantity + 1 }
                              : a
                          ));
                        }}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Add any special instructions..."
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-sm text-gray-500">Total:</span>
            <span className="text-lg font-bold ml-2">
              {formatCurrency(
                (menuItem.price * quantity) +
                selectedAddons.reduce((sum, addon) => 
                  sum + (addon.addon.price * addon.quantity), 0
                ) * quantity
              )}
            </span>
          </div>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeOrder; 