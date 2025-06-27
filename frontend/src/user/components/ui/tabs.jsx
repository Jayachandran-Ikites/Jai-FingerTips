import React, { createContext, useContext, useState } from "react";
import { motion } from "framer-motion";

const TabsContext = createContext();

const Tabs = ({ defaultValue, value, onValueChange, className = "", children, ...props }) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, className = "", children, ...props }) => {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative ${
        isActive 
          ? "bg-background text-foreground shadow-sm" 
          : "hover:bg-background/50"
      } ${className}`}
      onClick={() => context?.onValueChange(value)}
      {...props}
    >
      {children}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-background rounded-sm shadow-sm"
          layoutId="activeTab"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          style={{ zIndex: -1 }}
        />
      )}
    </button>
  );
};

const TabsContent = ({ value, className = "", children, ...props }) => {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };