import { useMemo } from 'react';
import { useRecords } from '../context/RecordsContext';
import type { RecordItem, RecordStatus } from '../types';

/**
 * Custom hook that provides filtered records based on status filter.
 * This separates derived state logic from presentation components.
 */
export function useFilteredRecords(filter: 'all' | RecordStatus): RecordItem[] {
  const { records } = useRecords();
  
  return useMemo(() => {
    if (filter === 'all') {
      return records;
    }
    return records.filter((record) => record.status === filter);
  }, [records, filter]);
}
