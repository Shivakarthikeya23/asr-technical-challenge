'use client';

/*
 * RecordsContext is the single source of truth for all record data in this
 * interview exercise.  It encapsulates data fetching from the mock API,
 * exposes mutation functions for updating records, and maintains a simple
 * history log of status changes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { RecordItem, RecordStatus, RecordHistoryEntry } from '../types';

interface RecordsContextValue {
  records: RecordItem[];
  loading: boolean;
  error: string | null;
  /**
   * Update a record’s status and/or note. This function calls the mock API
   * and then updates local state. Errors are set on the context.
   */
  updateRecord: (id: string, updates: { status?: RecordStatus; note?: string }) => Promise<void>;
  /**
   * Refresh the list of records from the API. Useful after a mutation
   * or when you need the latest state.
   */
  refresh: () => Promise<void>;

  /**
   * A log of record updates performed during this session. Each entry
   * records the record id, previous and new status, optional note and a
   * timestamp. This can be used to build an audit log or to teach
   * candidates about derived state.
   */
  history: RecordHistoryEntry[];
  /**
   * Clears the history log.
   */
  clearHistory: () => void;
}

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RecordHistoryEntry[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mock/records');
      if (!response.ok) {
        throw new Error(`Failed to load records: ${response.statusText}`);
      }
      const incoming = (await response.json()) as RecordItem[];
      setRecords(incoming);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateRecord = useCallback(async (id: string, updates: { status?: RecordStatus; note?: string }) => {
    setError(null);
    try {
      const response = await fetch('/api/mock/records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update record: ${response.statusText}`);
      }
      const updated = (await response.json()) as RecordItem;
      
      // Capture previous state BEFORE updating records for history
      // Use functional update to get current state, but capture prevRecord first
      let prevRecord: RecordItem | undefined;
      setRecords((prev) => {
        prevRecord = prev.find((r) => r.id === id);
        return prev.map((r) => (r.id === updated.id ? updated : r));
      });
      
      // Add history entry AFTER records update, if status changed
      // Use functional update to prevent duplicates (e.g., from React Strict Mode double renders)
      if (prevRecord && updates.status && prevRecord.status !== updates.status) {
        // Capture values before entering callback to satisfy TypeScript
        const previousStatus = prevRecord.status;
        const newStatus = updates.status;
        const note = updates.note;
        
        setHistory((prevHist) => {
          // Prevent duplicate entries: check if the last entry for this record ID
          // already has the same status change (within last second to handle rapid updates)
          const lastEntry = prevHist[prevHist.length - 1];
          const now = Date.now();
          const oneSecondAgo = now - 1000;
          
          if (
            lastEntry &&
            lastEntry.id === id &&
            lastEntry.previousStatus === previousStatus &&
            lastEntry.newStatus === newStatus &&
            new Date(lastEntry.timestamp).getTime() > oneSecondAgo
          ) {
            // Duplicate detected, return existing history
            return prevHist;
          }
          
          // Add new entry
          const entry: RecordHistoryEntry = {
            id,
            previousStatus,
            newStatus,
            note,
            timestamp: new Date().toISOString(),
          };
          return [...prevHist, entry];
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      throw error;
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const value = {
    records,
    loading,
    error,
    updateRecord,
    refresh,
    history,
    clearHistory,
  };
  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within a RecordsProvider');
  return ctx;
}
