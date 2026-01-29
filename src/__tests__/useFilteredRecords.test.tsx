import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecordsProvider } from "@/app/interview/context/RecordsContext";
import { useFilteredRecords } from "@/app/interview/hooks/useFilteredRecords";
import type { RecordItem } from "@/app/interview/types";
import React from "react";

// Mock fetch globally
global.fetch = vi.fn();

const mockRecords: RecordItem[] = [
  {
    id: "1",
    name: "Specimen A",
    description: "Collected near river bank",
    status: "pending",
  },
  {
    id: "2",
    name: "Specimen B",
    description: "Found in forest",
    status: "approved",
  },
  {
    id: "3",
    name: "Specimen C",
    description: "From mountain",
    status: "pending",
  },
  {
    id: "4",
    name: "Specimen D",
    description: "Coastal area",
    status: "flagged",
  },
];

describe("useFilteredRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock initial GET request
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecords,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RecordsProvider>{children}</RecordsProvider>
  );

  it("returns all records when filter is 'all'", async () => {
    const { result } = renderHook(() => useFilteredRecords("all"), { wrapper });

    await waitFor(() => {
      expect(result.current).toHaveLength(4);
      expect(result.current.map((r) => r.id)).toEqual(["1", "2", "3", "4"]);
    });
  });

  it("filters records by status correctly - pending", async () => {
    const { result } = renderHook(() => useFilteredRecords("pending"), { wrapper });

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
      expect(result.current.every((r) => r.status === "pending")).toBe(true);
      expect(result.current.map((r) => r.id)).toEqual(["1", "3"]);
    });
  });

  it("filters records by status correctly - approved", async () => {
    const { result } = renderHook(() => useFilteredRecords("approved"), { wrapper });

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].status).toBe("approved");
      expect(result.current[0].id).toBe("2");
    });
  });

  it("filters records by status correctly - flagged", async () => {
    const { result } = renderHook(() => useFilteredRecords("flagged"), { wrapper });

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].status).toBe("flagged");
      expect(result.current[0].id).toBe("4");
    });
  });

  it("returns empty array when no records match filter", async () => {
    const { result } = renderHook(() => useFilteredRecords("needs_revision"), { wrapper });

    await waitFor(() => {
      expect(result.current).toHaveLength(0);
    });
  });

  it("updates filtered results when filter changes", async () => {
    const { result, rerender } = renderHook(
      ({ filter }: { filter: "all" | "pending" | "approved" | "flagged" | "needs_revision" }) =>
        useFilteredRecords(filter),
      {
        wrapper,
        initialProps: { filter: "approved" },
      }
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].status).toBe("approved");
    });

    // Change filter to 'all' to see all records
    rerender({ filter: "all" });

    await waitFor(() => {
      expect(result.current).toHaveLength(4);
      expect(result.current.map((r) => r.id)).toEqual(["1", "2", "3", "4"]);
    });

    // Change filter to 'pending'
    rerender({ filter: "pending" });

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
      expect(result.current.every((r) => r.status === "pending")).toBe(true);
    });
  });
});
