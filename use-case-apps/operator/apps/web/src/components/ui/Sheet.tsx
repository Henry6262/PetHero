import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface SheetContentProps {
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
}

interface SheetTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

const SheetContext = ({ children }: { children: ReactNode }) => <>{children}</>;

function Sheet({ open, onOpenChange, children }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <SheetContext>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              zIndex: 40,
            }}
          />
        )}
      </AnimatePresence>
    </SheetContext>
  );
}

function SheetTrigger({ children }: SheetTriggerProps) {
  return <>{children}</>;
}

function SheetContent({ children, side = "left", className = "" }: SheetContentProps) {
  const isLeft = side === "left";
  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: isLeft ? "-100%" : "100%" }}
        animate={{ x: 0 }}
        exit={{ x: isLeft ? "-100%" : "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className={className}
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          [isLeft ? "left" : "right"]: 0,
          width: 420,
          maxWidth: "90vw",
          background: "#0b0f14",
          borderRight: isLeft ? "1px solid #1f2937" : undefined,
          borderLeft: !isLeft ? "1px solid #1f2937" : undefined,
          color: "#e5e7eb",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          boxShadow: isLeft
            ? "4px 0 24px rgba(0,0,0,0.45)"
            : "-4px 0 24px rgba(0,0,0,0.45)",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function SheetHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <header
      className={className}
      style={{ padding: "16px 20px", borderBottom: "1px solid #1f2937" }}
    >
      {children}
    </header>
  );
}

function SheetTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#e5e7eb" }}>
      {children}
    </h2>
  );
}

function SheetDescription({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9ca3af" }}>{children}</p>
  );
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription };
