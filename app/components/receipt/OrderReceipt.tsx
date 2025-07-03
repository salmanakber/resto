"use client"

import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderReceiptProps {
  orderNumber?: string;
  date?: string;
  time?: string;
  table?: string;
  server?: string;
  items?: OrderItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  autoPrint?: boolean;
}

export default function OrderReceipt({ 
  orderNumber = "1238",
  date = "03/12/2025",
  time = "1:45 PM",
  table = "5",
  server = "John D.",
  items = [
    { name: "Pho Beef Special", quantity: 2, price: 14.99 },
    { name: "Spring Rolls", quantity: 1, price: 6.99 },
    { name: "Vietnamese Coffee", quantity: 2, price: 4.99 }
  ],
  subtotal = 46.95,
  tax = 3.76,
  total = 50.71,
  autoPrint = false
}: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  // If autoPrint is true, trigger printing automatically when component mounts
  useEffect(() => {
    if (autoPrint) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    if (!receiptRef.current) return;
    
    // Create a style element for the print styles
    const style = document.createElement('style');
    style.innerHTML = `
    @media print {
      @page {
        size: auto;
        margin: 0; /* Remove default margins */
      }
  
      html, body {
        padding: 0 !important;
        margin: 0 !important;
        height: 100%;
      }
  
      body * {
        visibility: hidden;
      }
  
      #receipt-for-print, #receipt-for-print * {
        visibility: visible;
      }
  
      #receipt-for-print {
        position: absolute !important;
        top: 0;
        left: 0;
        width: 100vw;
        height: auto;
        padding: 0 !important;
        margin: 0 auto !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
    }
  `;
  

    document.head.appendChild(style);
    
    // Trigger the browser's print dialog
    window.print();
    
    // Clean up after printing
    document.head.removeChild(style);
  };

  return (
    <div>
      <Button onClick={handlePrint} className="mb-4 print:hidden">
        <Printer className="h-4 w-4 mr-2" />
        Print Receipt
      </Button>

      {/* Receipt template - always in DOM for direct printing */}
      <div id="receipt-for-print" ref={receiptRef} className="hidden print:block max-w-[300px] mx-auto bg-white border border-gray-200 shadow-sm">
        <div className="p-4">
          {/* Restaurant Logo and Info */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-red-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white"></div>
              </div>
            </div>
            <div className="text-xl font-bold mb-1">OpenPho</div>
            <div className="text-sm">123 Main Street</div>
            <div className="text-sm">Anytown, ST 12345</div>
            <div className="text-sm">Tel: (555) 123-4567</div>
          </div>

          <div className="border-t border-gray-300 my-4"></div>

          {/* Order Info */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="font-medium">Order #:</div>
            <div className="text-right">{orderNumber}</div>
            
            <div className="font-medium">Date:</div>
            <div className="text-right">{date}</div>
            
            <div className="font-medium">Time:</div>
            <div className="text-right">{time}</div>
            
            <div className="font-medium">Table:</div>
            <div className="text-right">{table}</div>
            
            <div className="font-medium">Server:</div>
            <div className="text-right">{server}</div>
          </div>

          <div className="border-t border-gray-300 my-4"></div>

          {/* Order Items */}
          <div className="mb-4">
            <div className="grid grid-cols-3 font-medium mb-2">
              <div>Qty</div>
              <div>Item</div>
              <div className="text-right">Price</div>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-3 mb-2">
                <div>{item.quantity}</div>
                <div>{item.name}</div>
                <div className="text-right">${(item.quantity * item.price).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-300 my-4"></div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="font-medium">Subtotal:</div>
            <div className="text-right">${subtotal.toFixed(2)}</div>
            
            <div className="font-medium">Tax (8%):</div>
            <div className="text-right">${tax.toFixed(2)}</div>
            
            <div className="font-medium">Total:</div>
            <div className="text-right font-bold">${total.toFixed(2)}</div>
          </div>

          <div className="text-center my-6">
            <div className="mb-1">Thank you for dining with us!</div>
            <div>Please come again</div>
          </div>

          {/* Barcode */}
          <div className="text-center mt-6">
            <svg className="inline-block" width="240" height="50" viewBox="0 0 240 50">
              {/* Barcode */}
              {Array.from({ length: 40 }).map((_, i) => (
                <rect 
                  key={i} 
                  x={i * 6} 
                  y={0} 
                  width={i % 3 === 0 ? 4 : 2} 
                  height={40} 
                  fill="black" 
                />
              ))}
            </svg>
            <div className="mt-1 font-mono">*{orderNumber}*</div>
          </div>
        </div>
      </div>
    </div>
  );
} 