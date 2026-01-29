"use client";

import { useState, useEffect } from "react";

import { useRecords } from "../context/RecordsContext";
import { useFilteredRecords } from "../hooks/useFilteredRecords";
import type { RecordItem, RecordStatus } from "../types";
import RecordCard from "./RecordCard";
import RecordDetailDialog from "./RecordDetailDialog";
import RecordFilter from "./RecordFilter";
import RecordSummary from "./RecordSummary";
import HistoryLog from "./HistoryLog";
import { Button } from "@/components/ui/button";

/**
 * RecordList orchestrates the interview page by coordinating filter state,
 * record selection, and composing child components for presentation.
 * This follows the Container/Presenter pattern where RecordList is the
 * container managing state, while RecordCard, RecordSummary, etc. are presenters.
 */
export default function RecordList() {
  const { records, loading, error, refresh } = useRecords();
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [filter, setFilter] = useState<"all" | RecordStatus>("all");
  
  // Use custom hook for derived filtered state
  const filteredRecords = useFilteredRecords(filter);

  // Keep selectedRecord in sync with latest record data from context
  useEffect(() => {
    if (selectedRecord) {
      const updatedRecord = records.find((r) => r.id === selectedRecord.id);
      if (updatedRecord) {
        setSelectedRecord(updatedRecord);
      }
    }
  }, [records, selectedRecord?.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Records
          </h2>
          <p className="text-sm text-muted-foreground">
            {records.length} total • {filteredRecords.length} showing
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <RecordFilter value={filter} onChange={setFilter} />
          <Button variant="ghost" onClick={() => refresh()} disabled={loading}>
            Reload
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">Error: {error}</p>
        </div>
      )}
      
      {loading && (
        <p className="text-sm text-muted-foreground">Loading records...</p>
      )}
      
      <RecordSummary />
      
      {filteredRecords.length === 0 && !loading && !error ? (
        <p className="text-sm text-muted-foreground">
          {filter === "all" 
            ? "No records found." 
            : `No records with status "${filter.replace("_", " ")}".`}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecords.map((record) => (
            <RecordCard 
              key={record.id} 
              record={record} 
              onSelect={setSelectedRecord} 
            />
          ))}
        </div>
      )}
      
      {selectedRecord && (
        <RecordDetailDialog 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} 
        />
      )}
      
      <HistoryLog />
    </div>
  );
}
