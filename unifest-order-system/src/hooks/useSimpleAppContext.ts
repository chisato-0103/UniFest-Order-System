import { useContext } from "react";
import { SimpleAppContext } from "../contexts/SimpleAppContext2";

export const useSimpleAppContext = () => {
  const context = useContext(SimpleAppContext);
  if (!context) {
    throw new Error(
      "useSimpleAppContext must be used within a SimpleAppProvider"
    );
  }
  return context;
};
