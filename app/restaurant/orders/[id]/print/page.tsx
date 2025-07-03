"use client"

import React, { useEffect, useState } from 'react';
import OrderReceipt from '@/app/components/receipt/OrderReceipt';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrintReceiptPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState({
    orderNumber: params.id,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    table: "5",
    server: "John D.",
    items: [
      { name: "Pho Beef Special", quantity: 2, price: 14.99 },
      { name: "Spring Rolls", quantity: 1, price: 6.99 },
      { name: "Vietnamese Coffee", quantity: 2, price: 4.99 }
    ],
    subtotal: 46.95,
    tax: 3.76,
    total: 50.71
  });

  // Auto-trigger the print dialog when component is loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // We don't need this anymore as the component will handle printing
      // setTimeout(() => {
      //   window.print();
      // }, 500);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center">
        <Button 
          variant="outline" 
          onClick={() => router.back()} 
          className="mr-4 print:hidden"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold print:hidden">Order Receipt</h1>
      </div>

      <Card className="mb-6 print:shadow-none print:border-none max-w-md mx-auto">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="animate-pulse text-center">
                <div className="rounded-full bg-gray-200 w-16 h-16 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-48 mb-4 mx-auto"></div>
                <div className="h-3 bg-gray-200 rounded w-32 mb-2 mx-auto"></div>
                <div className="h-3 bg-gray-200 rounded w-36 mb-6 mx-auto"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded w-3/4 mb-2.5"></div>
              </div>
            </div>
          ) : (
            <OrderReceipt {...orderData} autoPrint={true} />
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 print:hidden max-w-md mx-auto">
        <p>The print dialog should open automatically.</p>
        <p>If it doesn't, click the Print Receipt button on the receipt above.</p>
        <p className="mt-2">For best results, select "Print without margins" or "Fit to page" in your print dialog.</p>
      </div>
    </div>
  );
} 