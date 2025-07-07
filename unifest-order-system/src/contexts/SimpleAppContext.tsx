import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// 簡単なState型定義
interface SimpleAppState {
  loading: boolean;
  error: string | null;
}

// 簡単なContext型定義
interface SimpleAppContextType {
  state: SimpleAppState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const SimpleAppContext = createContext<SimpleAppContextType | undefined>(
  undefined
);

interface SimpleAppProviderProps {
  children: ReactNode;
}

export const SimpleAppProvider: React.FC<SimpleAppProviderProps> = ({
  children,
}) => {
  const [state, setState] = useState<SimpleAppState>({
    loading: false,
    error: null,
  });

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  return (
    <SimpleAppContext.Provider value={{ state, setLoading, setError }}>
      {children}
    </SimpleAppContext.Provider>
  );
};

export const useSimpleApp = () => {
  const context = useContext(SimpleAppContext);
  if (context === undefined) {
    throw new Error("useSimpleApp must be used within a SimpleAppProvider");
  }
  return context;
};
