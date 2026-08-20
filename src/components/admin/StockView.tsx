import React from 'react';
import { Boxes, Package, Plus, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { saveProductToFirestore } from '../../services/firebaseService';

interface StockViewProps {
  products: Product[];
  onOpenProductModal: (product: Product) => void;
}

export const StockView: React.FC<StockViewProps> = ({ products, onOpenProductModal }) => {
  const handleQuickAdjustStock = async (product: Product, size: string, delta: number) => {
    const currentStock = { ...(product.stock || {}) };
    const currentQty = typeof currentStock[size] === 'number' ? currentStock[size] : 10;
    const newQty = Math.max(0, currentQty + delta);
    currentStock[size] = newQty;

    try {
      await saveProductToFirestore({
        ...product,
        stock: currentStock
      });
    } catch (err) {
      console.error('Stock adjust error:', err);
    }
  };

  return (
    <div className="space-y-6 pt-2">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-sans text-stone-900 tracking-tight">
          Stock & Inventory Management
        </h1>
        <p className="text-xs text-stone-500 font-sans mt-0.5">
          Real-time size stock tracking and inventory adjustments synced with Cloud Firestore.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const totalUnits = Object.values(product.stock || {}).reduce<number>((a, b) => a + Number(b || 0), 0);
          const isLowStock = totalUnits <= 5;

          return (
            <div
              key={product.id}
              className="p-5 rounded-2xl bg-white border border-stone-200/70 shadow-2xs space-y-4"
            >
              {/* Product Info */}
              <div className="flex items-center gap-3">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-14 object-cover rounded-xl border border-stone-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-14 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-stone-900 truncate font-sans uppercase">
                    {product.name}
                  </h3>
                  <span className="text-[11px] font-mono text-stone-500 block">
                    Rs {product.price}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isLowStock ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {totalUnits} Total in Stock
                    </span>
                  </div>
                </div>
              </div>

              {/* Sizes breakdown with live buttons */}
              <div className="space-y-2 border-t border-stone-100 pt-3">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">
                  Quick Size Adjust
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  {(product.sizes || ['S', 'M', 'L', 'XL']).map((sz) => {
                    const qty = product.stock?.[sz] ?? 10;
                    return (
                      <div
                        key={sz}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#faf9f8] border border-stone-100 text-xs font-mono"
                      >
                        <span className="font-bold text-stone-700">{sz}: <strong className={qty === 0 ? 'text-red-500' : 'text-stone-900'}>{qty}</strong></span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustStock(product, sz, -1)}
                            disabled={qty <= 0}
                            className="w-5 h-5 rounded-md bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-600 disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustStock(product, sz, 1)}
                            className="w-5 h-5 rounded-md bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-600 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Full Edit button */}
              <button
                type="button"
                onClick={() => onOpenProductModal(product)}
                className="w-full py-2 text-xs font-sans font-medium text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer text-center"
              >
                Edit Product Details
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
