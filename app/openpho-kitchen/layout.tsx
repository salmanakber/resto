import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Management System",
  description: "Restaurant order management and tracking system",
};

export default function OrderScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="order-screen-layout">
      {children}
    </div>
  );
} 