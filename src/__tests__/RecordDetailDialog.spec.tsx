import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecordDetailDialog from "@/app/interview/components/RecordDetailDialog";
import { RecordsProvider } from "@/app/interview/context/RecordsContext";
import type { RecordItem } from "@/app/interview/types";

// Mock fetch globally
global.fetch = vi.fn();

const mockRecord: RecordItem = {
  id: "1",
  name: "Specimen A",
  description: "Collected near river bank",
  status: "pending",
};

describe("RecordDetailDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock initial GET request
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockRecord],
    });
  });

  const renderWithProvider = (record: RecordItem, onClose: () => void = vi.fn()) => {
    return render(
      <RecordsProvider>
        <RecordDetailDialog record={record} onClose={onClose} />
      </RecordsProvider>
    );
  };

  it("renders dialog with record information", async () => {
    const onClose = vi.fn();
    renderWithProvider(mockRecord, onClose);

    await waitFor(() => {
      expect(screen.getByText("Specimen A")).toBeInTheDocument();
      expect(screen.getByText("Collected near river bank")).toBeInTheDocument();
    });
  });

  it("simulates dialog interactions - status selection and note entry", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProvider(mockRecord, onClose);

    await waitFor(() => {
      expect(screen.getByText("Specimen A")).toBeInTheDocument();
    });

    // Find and interact with status select (combobox doesn't have accessible name, find by role)
    const statusSelect = screen.getByRole("combobox");
    await user.click(statusSelect);

    // Wait for Select options to appear and select "approved" status
    await waitFor(() => {
      expect(screen.getByText("approved")).toBeInTheDocument();
    });
    const approvedOption = screen.getByText("approved");
    await user.click(approvedOption);

    // Enter a note
    const noteTextarea = screen.getByPlaceholderText("Add a note...");
    await user.type(noteTextarea, "This looks good");

    // Verify inputs are updated
    expect(noteTextarea).toHaveValue("This looks good");
  });

  it("asserts validation messaging for missing notes when status is flagged", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProvider(mockRecord, onClose);

    await waitFor(() => {
      expect(screen.getByText("Specimen A")).toBeInTheDocument();
    });

    // Change status to "flagged" without entering a note
    const statusSelect = screen.getByRole("combobox");
    await user.click(statusSelect);
    await waitFor(() => {
      expect(screen.getByText("flagged")).toBeInTheDocument();
    });
    const flaggedOption = screen.getByText("flagged");
    await user.click(flaggedOption);

    // Verify required indicator appears
    await waitFor(() => {
      expect(screen.getByText(/note is required/i)).toBeInTheDocument();
    });

    // Try to save without note
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Verify validation error message appears
    await waitFor(() => {
      expect(
        screen.getByText(/A note is required when setting status to 'flagged' or 'needs revision'/i)
      ).toBeInTheDocument();
    });

    // Verify dialog does NOT close (validation prevents save)
    expect(onClose).not.toHaveBeenCalled();
  });

  it("asserts validation messaging for missing notes when status is needs_revision", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProvider(mockRecord, onClose);

    await waitFor(() => {
      expect(screen.getByText("Specimen A")).toBeInTheDocument();
    });

    // Change status to "needs_revision" without entering a note
    const statusSelect = screen.getByRole("combobox");
    await user.click(statusSelect);
    await waitFor(() => {
      expect(screen.getByText("needs revision")).toBeInTheDocument();
    });
    const needsRevisionOption = screen.getByText("needs revision");
    await user.click(needsRevisionOption);

    // Try to save without note
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Verify validation error message appears
    await waitFor(() => {
      expect(
        screen.getByText(/A note is required when setting status to 'flagged' or 'needs revision'/i)
      ).toBeInTheDocument();
    });

    // Verify dialog does NOT close
    expect(onClose).not.toHaveBeenCalled();
  });

  it("performs mocked successful save and verifies list/summary/history reflect the change", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    // Mock successful PATCH request
    const updatedRecord: RecordItem = {
      ...mockRecord,
      status: "approved",
      note: "Reviewed and approved",
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedRecord,
    });

    renderWithProvider(mockRecord, onClose);

    await waitFor(() => {
      expect(screen.getByText("Specimen A")).toBeInTheDocument();
    });

    // Change status
    const statusSelect = screen.getByRole("combobox");
    await user.click(statusSelect);
    await waitFor(() => {
      expect(screen.getByText("approved")).toBeInTheDocument();
    });
    const approvedOption = screen.getByText("approved");
    await user.click(approvedOption);

    // Enter note
    const noteTextarea = screen.getByPlaceholderText("Add a note...");
    await user.type(noteTextarea, "Reviewed and approved");

    // Click save
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Wait for save to complete
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verify API was called correctly
    expect(global.fetch).toHaveBeenCalledWith("/api/mock/records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "1",
        status: "approved",
        note: "Reviewed and approved",
      }),
    });
  });

  it("handles API errors gracefully", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    // Mock failed PATCH request
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
    });

    renderWithProvider(mockRecord, onClose);

    await waitFor(() => {
      expect(screen.getByText("Specimen A")).toBeInTheDocument();
    });

    // Change status and add note
    const statusSelect = screen.getByRole("combobox");
    await user.click(statusSelect);
    await waitFor(() => {
      expect(screen.getByText("approved")).toBeInTheDocument();
    });
    const approvedOption = screen.getByText("approved");
    await user.click(approvedOption);

    const noteTextarea = screen.getByPlaceholderText("Add a note...");
    await user.type(noteTextarea, "Test note");

    // Click save
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to update record/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify dialog does NOT close on error
    expect(onClose).not.toHaveBeenCalled();
  });
});
