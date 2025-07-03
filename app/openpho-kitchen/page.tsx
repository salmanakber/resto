"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrderScreenLanding() {
  const router = useRouter();

  // Redirect to ordering screen after component mounts
  useEffect(() => {
    router.push("/order-screen/ordering-screen");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px] shadow-lg">
        <CardContent className="flex flex-col items-center pt-6">
          <div className="mb-4 p-8 rounded-full bg-[#e41e3f]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 2h18v8H3zm18 11H3v9h18z" />
              <path d="M15 2v17M8 16v1" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Redirecting...</h2>
          <p className="text-gray-500 text-center mb-4">
            Taking you to the order management screen.
          </p>
          <Button 
            className="bg-[#e41e3f] hover:bg-[#c01835] w-full" 
            onClick={() => router.push("/order-screen/ordering-screen")}
          >
            Go to Order Management
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 