'use client'
// context/AppContextProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

// Loyalty Points
type LoyaltyPointsContextType = {
  loyaltyPointsGlobal: number;
  setLoyaltyPointsGlobal: (points: number) => void;
  loyaltyDiscount: number;
  setLoyaltyDiscount: (points: number) => void;
};

const LoyaltyPointsContext = createContext<LoyaltyPointsContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [loyaltyPointsGlobal, setLoyaltyPointsGlobal] = useState<number>(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);

  return (
    <LoyaltyPointsContext.Provider value={{ loyaltyPointsGlobal, setLoyaltyPointsGlobal, loyaltyDiscount, setLoyaltyDiscount }}>
      {children}
    </LoyaltyPointsContext.Provider>
  );
};

export const useLoyaltyPointsGlobal = () => {
  const context = useContext(LoyaltyPointsContext);
  if (!context) throw new Error("useLoyaltyPointsGlobal must be used within AppContextProvider");
  return context;
};
  