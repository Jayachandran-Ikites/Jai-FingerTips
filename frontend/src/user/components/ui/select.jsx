import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiCheck } from "react-icons/fi";

const Select = ({ value, onValueChange, children, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const selectRef = useRef(null);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleValueChange = (newValue) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className="relative" {...props}>
      {React.Children.map(children, (child) => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, { 
            isOpen, 
            onClick: () => setIsOpen(!isOpen),
            selectedValue 
          });
        }
        if (child.type === SelectContent) {
          return React.cloneElement(child, { 
            isOpen, 
            selectedValue, 
            onValueChange: handleValueChange 
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectTrigger = ({ className = "", children, isOpen, onClick, selectedValue, ...props }) => {
  return (
    <button
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
      <FiChevronDown 
        className={`h-4 w-4 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
      />
    </button>
  );
};

const SelectValue = ({ placeholder, children }) => {
  return <span>{children || placeholder}</span>;
};

const SelectContent = ({ className = "", children, isOpen, selectedValue, onValueChange, ...props }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={`absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden ${className}`}
          {...props}
        >
          <div className="p-1 max-h-60 bg-white overflow-auto">
            {React.Children.map(children, (child) => {
              if (child.type === SelectItem) {
                return React.cloneElement(child, { 
                  selectedValue, 
                  onValueChange 
                });
              }
              return child;
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SelectItem = ({ value, className = "", children, selectedValue, onValueChange, ...props }) => {
  const isSelected = selectedValue === value;

  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
        isSelected ? 'bg-accent text-accent-foreground' : ''
      } ${className}`}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          
          <FiCheck className="h-4 w-4" />
        </span>
      )}
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };