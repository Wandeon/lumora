'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import { useCart, CartItem } from '@/shared/contexts/cart-context';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  currency?: string;
}

export function CartSidebar({
  isOpen,
  onClose,
  onCheckout,
  currency = 'EUR',
}: CartSidebarProps) {
  const { items, removeItem, updateQuantity, total, itemCount, clear } =
    useCart();

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Cart ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Close cart"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Your cart is empty</p>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onQuantityChange={(q) => updateQuantity(item.id, q)}
                formatPrice={formatPrice}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-800 space-y-4">
            <div className="flex items-center justify-between text-white">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">{formatPrice(total)}</span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Proceed to Checkout
            </button>

            <button
              onClick={clear}
              className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </Fragment>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
  formatPrice: (cents: number) => string;
}

function CartItemRow({
  item,
  onRemove,
  onQuantityChange,
  formatPrice,
}: CartItemRowProps) {
  return (
    <div className="flex gap-4 p-3 bg-gray-800 rounded-lg">
      {/* Thumbnail */}
      {item.photoThumbnail && (
        <div className="w-16 h-16 flex-shrink-0 bg-gray-700 rounded overflow-hidden">
          <Image
            src={item.photoThumbnail}
            alt=""
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">
          {item.productName}
        </p>
        <p className="text-sm text-gray-400">{formatPrice(item.unitPrice)}</p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onQuantityChange(item.quantity - 1)}
            className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            -
          </button>
          <span className="text-white text-sm w-8 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onQuantityChange(item.quantity + 1)}
            className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            +
          </button>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 text-gray-500 hover:text-rose-500 transition-colors"
        aria-label="Remove item"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}
