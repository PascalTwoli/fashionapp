/**
 * Admin Order Search Bar
 */

import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OrderSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const OrderSearchBar: React.FC<OrderSearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Search by order #, email, phone, customer name...",
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10 h-10 rounded-none border-border bg-white text-sm"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="absolute right-1 top-1 h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
