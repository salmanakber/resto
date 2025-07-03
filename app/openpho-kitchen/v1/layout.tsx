import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kitchen Order Management",
  description: "Manage and track orders in real-time",
};

export default function OrderingScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ordering-screen-layout">
      {children}
    </div>
  );
} 