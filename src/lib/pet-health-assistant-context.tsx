"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type PetHealthAssistantContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openAssistant: () => void;
  closeAssistant: () => void;
};

const PetHealthAssistantContext =
  createContext<PetHealthAssistantContextValue | null>(null);

export function PetHealthAssistantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openAssistant = useCallback(() => setOpen(true), []);
  const closeAssistant = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      openAssistant,
      closeAssistant,
    }),
    [open, openAssistant, closeAssistant]
  );

  return (
    <PetHealthAssistantContext.Provider value={value}>
      {children}
    </PetHealthAssistantContext.Provider>
  );
}

export function usePetHealthAssistant() {
  const ctx = useContext(PetHealthAssistantContext);
  if (!ctx) {
    throw new Error(
      "usePetHealthAssistant must be used within PetHealthAssistantProvider"
    );
  }
  return ctx;
}

/** Safe hook when provider may be absent (e.g. tests). */
export function usePetHealthAssistantOptional() {
  return useContext(PetHealthAssistantContext);
}
