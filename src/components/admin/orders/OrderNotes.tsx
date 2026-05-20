/**
 * Admin Order Notes
 * Allows admins to add, edit, delete internal notes
 */

import React, { useState } from "react";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminOrderNote } from "@/types/admin";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface OrderNotesProps {
  notes: AdminOrderNote[];
  orderId: string;
  onAddNote: (note: string) => Promise<void>;
  onUpdateNote: (noteId: string, note: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  isLoading?: boolean;
}

export const OrderNotes: React.FC<OrderNotesProps> = ({
  notes,
  orderId,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddNote(newNote);
      setNewNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingText.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdateNote(noteId, editingText);
      setEditingNoteId(null);
      setEditingText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setIsSubmitting(true);
    try {
      await onDeleteNote(noteId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (note: AdminOrderNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.note);
  };

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
          Add Internal Note
        </label>
        <Textarea
          placeholder="Add a note about this order (internal only)..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          disabled={isSubmitting}
          className="resize-none text-sm rounded-none border-border min-h-20"
        />
        <Button
          onClick={handleAddNote}
          disabled={!newNote.trim() || isSubmitting}
          size="sm"
          className="h-9 px-4 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
          Add Note
        </Button>
      </div>

      {/* Notes list */}
      {notes && notes.length > 0 ? (
        <div className="space-y-3 mt-6">
          <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
            {notes.length} {notes.length === 1 ? "Note" : "Notes"}
          </p>
          {notes.map((note) => (
            <div key={note.id} className="border border-border p-3 rounded-none bg-secondary/30">
              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    disabled={isSubmitting}
                    className="resize-none text-sm rounded-none border-border min-h-16"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={isSubmitting}
                      size="sm"
                      className="h-8 px-3 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
                      <Check className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={() => setEditingNoteId(null)}
                      disabled={isSubmitting}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-none text-xs uppercase tracking-wider">
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-foreground">{note.note}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(note.created_at), "MMM d, yyyy • h:mm a")}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => startEdit(note)}
                      disabled={isSubmitting}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={isSubmitting}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No notes yet</p>
      )}
    </div>
  );
};
