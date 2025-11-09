import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  expenseModalOpen: boolean;
  setExpenseModalOpen: (open: boolean) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  timeModalOpen: boolean;
  setTimeModalOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [timeModalOpen, setTimeModalOpen] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        expenseModalOpen,
        setExpenseModalOpen,
        searchModalOpen,
        setSearchModalOpen,
        timeModalOpen,
        setTimeModalOpen,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
