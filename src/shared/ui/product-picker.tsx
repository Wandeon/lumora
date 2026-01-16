'use client';

import { useState } from 'react';

export interface Product {
  id: string;
  name: string;
  price: number; // Price in cents
}

interface ProductPickerProps {
  products: Product[];
  onSelect: (productId: string, quantity: number) => void;
  onClose: () => void;
  currency?: string;
}

export function ProductPicker({
  products,
  onSelect,
  onClose,
  currency = 'EUR',
}: ProductPickerProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [quantity, setQuantity] = useState(1);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = () => {
    if (selectedProductId && quantity > 0) {
      onSelect(selectedProductId, quantity);
    }
  };

  if (products.length === 0) {
    return (
      <div className="absolute top-16 right-4 z-20 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl min-w-[280px]">
        <p className="text-white/80 text-sm">No products available</p>
        <button
          onClick={onClose}
          className="mt-3 w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-16 right-4 z-20 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl min-w-[280px]">
      <h3 className="text-white font-semibold mb-3">Select Product</h3>

      {/* Product selection */}
      <div className="space-y-2 mb-4">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => setSelectedProductId(product.id)}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
              selectedProductId === product.id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-white/80 hover:bg-gray-700'
            }`}
          >
            <span className="text-sm font-medium">{product.name}</span>
            <span className="text-sm">{formatPrice(product.price)}</span>
          </button>
        ))}
      </div>

      {/* Quantity selector */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/80 text-sm">Quantity</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded text-white transition-colors"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="text-white w-8 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded text-white transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Total */}
      {selectedProduct && (
        <div className="flex items-center justify-between mb-4 pt-3 border-t border-gray-700">
          <span className="text-white/80 text-sm">Total</span>
          <span className="text-white font-semibold">
            {formatPrice(selectedProduct.price * quantity)}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
