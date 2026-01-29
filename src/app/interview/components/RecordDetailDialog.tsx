"use client";

import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { useRecords } from "../context/RecordsContext";
import type { RecordItem, RecordStatus } from "../types";

interface RecordDetailDialogProps {
  record: RecordItem;
  onClose: () => void;
}

/**
 * RecordDetailDialog allows reviewers to inspect a specimen’s details and
 * update its status and accompanying note in a focused modal flow. Review
 * actions are performed via the Status dropdown, while the note captures
 * rationale or extra context for the change.
 * 
 * Validation: Notes are required when status is 'flagged' or 'needs_revision'.
 */
export default function RecordDetailDialog({
  record,
  onClose,
}: RecordDetailDialogProps) {
  const { updateRecord } = useRecords();
  const [status, setStatus] = useState<RecordStatus>(record.status);
  const [note, setNote] = useState<string>(record.note ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const statusOptions: RecordStatus[] = [
    "pending",
    "approved",
    "flagged",
    "needs_revision",
  ];

  // Reset validation error when status or note changes
  useEffect(() => {
    setValidationError(null);
    setSaveError(null);
  }, [status, note]);

  // Update local state when record prop changes (e.g., after external update)
  useEffect(() => {
    setStatus(record.status);
    setNote(record.note ?? "");
  }, [record]);

  const handleSave = async () => {
    // Validate: note is required for flagged and needs_revision statuses
    if ((status === "flagged" || status === "needs_revision") && !note.trim()) {
      setValidationError("A note is required when setting status to 'flagged' or 'needs revision'.");
      return;
    }

    // Check if anything actually changed
    const statusChanged = status !== record.status;
    const noteChanged = note.trim() !== (record.note ?? "");

    if (!statusChanged && !noteChanged) {
      // No changes, just close
      onClose();
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setValidationError(null);

    try {
      await updateRecord(record.id, {
        status: statusChanged ? status : undefined,
        note: noteChanged ? note.trim() || undefined : undefined,
      });
      // Success: close dialog
      onClose();
    } catch (error) {
      // Error handling is done in context, but we show a user-friendly message here
      const message = error instanceof Error ? error.message : "Failed to save changes";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg tracking-tight">
            {record.name}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {record.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as RecordStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Reviewer note
              {(status === "flagged" || status === "needs_revision") && (
                <span className="text-destructive ml-1">*</span>
              )}
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className={`min-h-24 ${validationError ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
            />
            {validationError && (
              <p className="mt-1 text-xs text-destructive">{validationError}</p>
            )}
            {!validationError && (
              <p className="mt-1 text-xs text-muted-foreground">
                {(status === "flagged" || status === "needs_revision")
                  ? "Note is required for this status."
                  : "Notes help other reviewers understand decisions."}
              </p>
            )}
          </div>
          {saveError && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{saveError}</p>
            </div>
          )}
        </div>
        <DialogFooter className="mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Close
          </Button>
          <Button variant="default" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
