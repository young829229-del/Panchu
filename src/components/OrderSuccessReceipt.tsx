import React from 'react';
import { OrderReceiptData } from '../types';

interface OrderSuccessReceiptProps {
  orderData: OrderReceiptData;
  onContinueShopping: () => void;
  theme?: 'light' | 'dark';
}

export const OrderSuccessReceipt: React.FC<OrderSuccessReceiptProps> = ({
  orderData,
  onContinueShopping
}) => {
  // Clean order number (remove # if present, or fallback)
  const cleanOrderNumber = orderData.orderId
    ? orderData.orderId.replace(/[^0-9a-zA-Z]/g, '') || orderData.orderId
    : '4684785754';

  // Format display amount with NPR currency
  const formattedTotal = `NPR ${orderData.totalAmount.toLocaleString()}`;

  // Payment method label
  const paymentMethodLabel = orderData.paymentMethod || 'Cash on Delivery';

  return (
    <div className="w-full min-h-screen bg-white text-black font-sans selection:bg-gray-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onContinueShopping}
          className="text-base font-normal text-black hover:opacity-70 transition-opacity cursor-pointer w-20 text-left"
        >
          Close
        </button>
        <h1 className="text-sm sm:text-base font-bold uppercase tracking-wider text-black text-center flex-1">
          ORDER COMPLETE
        </h1>
        <div className="w-20" />
      </header>

      {/* Main Order Confirmation Content */}
      <main className="max-w-lg mx-auto px-5 py-6">
        {/* Thank You Header */}
        <section className="space-y-1">
          <h2 className="text-2xl sm:text-[28px] font-bold text-black tracking-tight leading-tight">
            Thank you!
          </h2>
          <p className="text-sm text-neutral-600">
            Your order is being processed.
          </p>
        </section>

        {/* Order Details Key-Value Rows */}
        <section className="mt-7 space-y-2.5 text-sm text-black">
          <div className="flex justify-between items-center">
            <span className="text-black">Order number</span>
            <span className="text-black">{cleanOrderNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-black">Order total:</span>
            <span className="text-black">{formattedTotal}</span>
          </div>
          <div className="flex justify-between items-center font-bold pt-0.5">
            <span>{paymentMethodLabel}</span>
            <span>{formattedTotal}</span>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-t border-gray-200 my-6" />

        {/* Deliver To Section */}
        <section>
          <h2 className="text-xl font-bold text-black tracking-tight">
            Deliver to
          </h2>

          <div className="mt-4 space-y-1 text-sm text-black leading-snug">
            <p>{orderData.customerName}</p>
            <p>{orderData.shippingAddress}</p>
            {orderData.deliveryLocationLabel && (
              <p>{orderData.deliveryLocationLabel}</p>
            )}
            <p>{orderData.phone}</p>
          </div>

          <p className="mt-4 text-[#007a53] text-sm font-medium">
            Expected to arrive in 3–5 business days
          </p>
        </section>

        {/* Ordered Product Thumbnail & Price */}
        <section className="mt-7 space-y-6">
          {orderData.items.map((item, idx) => {
            const imgUrl = item.image || item.productImage;
            const itemPrice = (item.price || 0) * (item.quantity || 1);

            return (
              <div key={`${item.productId || idx}-${item.size}`} className="space-y-3">
                <div className="w-32 h-20 bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={item.name || item.productName || 'Ordered Item'}
                      className="w-full h-full object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs">No image</div>
                  )}
                </div>

                <div className="text-base font-bold text-black">
                  NPR {itemPrice.toLocaleString()}
                </div>
              </div>
            );
          })}
        </section>

        {/* Bottom Divider */}
        <hr className="border-t border-gray-200 my-6" />
      </main>
    </div>
  );
};
