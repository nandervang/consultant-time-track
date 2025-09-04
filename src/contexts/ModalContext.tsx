import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  // Invoice modals
  triggerNewInvoice: () => void;
  triggerNewClient: () => void;
  triggerLogTime: () => void;
  triggerAddExpense: () => void;
  triggerNewProject: () => void;
  
  // Modal states
  invoiceModalOpen: boolean;
  setInvoiceModalOpen: (open: boolean) => void;
  clientModalOpen: boolean;
  setClientModalOpen: (open: boolean) => void;
  timeModalOpen: boolean;
  setTimeModalOpen: (open: boolean) => void;
  expenseModalOpen: boolean;
  setExpenseModalOpen: (open: boolean) => void;
  projectModalOpen: boolean;
  setProjectModalOpen: (open: boolean) => void;
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
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const triggerNewInvoice = () => {
    setInvoiceModalOpen(true);
  };

  const triggerNewClient = () => {
    setClientModalOpen(true);
  };

  const triggerLogTime = () => {
    setTimeModalOpen(true);
  };

  const triggerAddExpense = () => {
    setExpenseModalOpen(true);
  };

  const triggerNewProject = () => {
    setProjectModalOpen(true);
  };

  const value: ModalContextType = {
    triggerNewInvoice,
    triggerNewClient,
    triggerLogTime,
    triggerAddExpense,
    triggerNewProject,
    invoiceModalOpen,
    setInvoiceModalOpen,
    clientModalOpen,
    setClientModalOpen,
    timeModalOpen,
    setTimeModalOpen,
    expenseModalOpen,
    setExpenseModalOpen,
    projectModalOpen,
    setProjectModalOpen,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};
