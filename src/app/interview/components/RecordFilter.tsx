"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { RecordStatus } from "../types";

/**
 * RecordFilter provides a status selection UI decoupled from the records list
 * to illustrate separation of concerns. It exposes a controlled `value` and an
 * `onChange` callback so filter state can be lifted to a parent.
 * 
 * Uses mounted state to prevent hydration errors with Radix UI Select component
 * which generates random IDs that differ between server and client renders.
 * The mounted state must be set in useEffect to ensure server and client render
 * the same initial HTML (native select), then switch to Radix Select after hydration.
 */
interface RecordFilterProps {
  value: "all" | RecordStatus;
  onChange: (value: "all" | RecordStatus) => void;
}

export default function RecordFilter({ value, onChange }: RecordFilterProps) {
  // Always start with false to ensure server and client render match
  const [mounted, setMounted] = useState(false);
  
  // Set mounted to true after hydration completes
  // This setState in useEffect is necessary for proper hydration handling
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Required for hydration: must render same HTML on server/client, then update after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  const options: ("all" | RecordStatus)[] = [
    "all",
    "pending",
    "approved",
    "flagged",
    "needs_revision",
  ];

  return (
    <div className="w-56">
      <label className="block text-sm font-medium mb-1">Filter by status</label>
      {mounted ? (
        <Select
          value={value}
          onValueChange={(v) => onChange(v as "all" | RecordStatus)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt} className="capitalize">
                {opt === "all" ? "All" : opt.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        // Fallback to native select during SSR to prevent hydration mismatch
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as "all" | RecordStatus)}
          className="w-full border rounded-md p-2 text-sm bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "all" ? "All" : opt.replace("_", " ")}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
