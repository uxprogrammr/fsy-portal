'use client';

import { useState, useEffect } from 'react';
import { ParticipantNote, NoteType, NoteCategory, NoteSeverity } from '@/types/participant-notes';
import { Box, Typography, Button, IconButton, Container, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Participant {
  fsy_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  stake_name: string;
  unit_name: string;
  participant_type: string;
  status: string;
  attendance_status?: string;
}

export default function ParticipantNotesPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [notes, setNotes] = useState<ParticipantNote[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<ParticipantNote | null>(null);
  const [newNote, setNewNote] = useState({
    note_type: '' as NoteType,
    category: '' as NoteCategory,
    message: '',
    severity: '' as NoteSeverity,
    photo_url: '',
  });

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch('/api/counselor-participants');
        if (!response.ok) throw new Error('Failed to fetch participants');
        const data = await response.json();
        setParticipants(data);
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };

    fetchParticipants();
  }, []);

  const fetchNotes = async (participantId: number) => {
    try {
      const response = await fetch(`/api/participant-notes?participantId=${participantId}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const data = await response.json();
      setNewNote(prev => ({ ...prev, photo_url: data.url }));
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const data = await response.json();
      setNoteToEdit(prev => prev ? { ...prev, photo_url: data.url } : null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedParticipant) return;
    if (!newNote.note_type || !newNote.category || !newNote.severity || !newNote.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/participant-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_fsy_id: selectedParticipant,
          ...newNote,
        }),
      });

      if (!response.ok) throw new Error('Failed to add note');
      
      // Reset form and refresh notes
      setNewNote({
        note_type: '' as NoteType,
        category: '' as NoteCategory,
        message: '',
        severity: '' as NoteSeverity,
        photo_url: '',
      });
      setIsAddingNote(false);
      fetchNotes(selectedParticipant);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleBackClick = () => {
    router.push('/dashboard');
  };

  const handleDeleteNote = async (noteId: number) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      // Find the note to get its photo URL
      const noteToDeleteData = notes.find(note => note.note_id === noteToDelete);
      if (!noteToDeleteData) {
        throw new Error('Note not found');
      }

      // If the note has a photo, delete it from Firebase Storage
      if (noteToDeleteData.photo_url) {
        const deletePhotoResponse = await fetch(`/api/upload?url=${encodeURIComponent(noteToDeleteData.photo_url)}`, {
          method: 'DELETE',
        });

        if (!deletePhotoResponse.ok) {
          console.error('Failed to delete photo from storage');
          // Continue with note deletion even if photo deletion fails
        }
      }

      // Delete the note from the database
      const response = await fetch(`/api/participant-notes?noteId=${noteToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete note');
      }

      // Remove the deleted note from the state
      setNotes(prevNotes => prevNotes.filter(note => note.note_id !== noteToDelete));
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const handleEditNote = (note: ParticipantNote) => {
    setNoteToEdit(note);
    setEditDialogOpen(true);
  };

  const handleUpdateNote = async () => {
    if (!noteToEdit) return;

    try {
      const response = await fetch(`/api/participant-notes?noteId=${noteToEdit.note_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_type: noteToEdit.note_type,
          category: noteToEdit.category,
          message: noteToEdit.message,
          severity: noteToEdit.severity,
          photo_url: noteToEdit.photo_url,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update note');
      }

      // Update the note in the state
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.note_id === noteToEdit.note_id ? noteToEdit : note
        )
      );
      setEditDialogOpen(false);
      setNoteToEdit(null);
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note. Please try again.');
    }
  };

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* Fixed Header */}
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bgcolor: '#00BCD4',
        color: 'white',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3 },
        zIndex: 1000
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={handleBackClick}
            sx={{ color: 'white' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Participant Notes
          </Typography>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ 
        height: '100%',
        overflow: 'auto',
        pt: { xs: '64px', sm: '80px' },
        pb: { xs: 3, sm: 4 },
        bgcolor: '#f5f5f5'
      }}>
        <Container maxWidth="sm" sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Participant Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Participant
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedParticipant || ''}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                setSelectedParticipant(id);
                if (id) fetchNotes(id);
              }}
            >
              <option value="">Select a participant...</option>
              {participants.map((participant) => (
                <option key={participant.fsy_id} value={participant.fsy_id}>
                  {participant.first_name} {participant.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Note Button */}
          {selectedParticipant && (
            <button
              onClick={() => setIsAddingNote(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md mb-6"
            >
              Add New Note
            </button>
          )}

          {/* Add Note Form */}
          {isAddingNote && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Add New Note</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-8">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="note_type"
                        value="Positive"
                        checked={newNote.note_type === 'Positive'}
                        onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value as NoteType })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Positive</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="note_type"
                        value="Negative"
                        checked={newNote.note_type === 'Negative'}
                        onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value as NoteType })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Negative</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newNote.category}
                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value as NoteCategory })}
                    required
                  >
                    <option value="">Select a category...</option>
                    <option value="Group Participation">Group Participation</option>
                    <option value="Leadership Initiative">Leadership Initiative</option>
                    <option value="Spiritual Insight">Spiritual Insight</option>
                    <option value="Kindness/Service">Kindness/Service</option>
                    <option value="Attendance & Functionality">Attendance & Functionality</option>
                    <option value="Technology Misuse">Technology Misuse</option>
                    <option value="Group Behavior & Participation">Group Behavior & Participation</option>
                    <option value="Curfew & Dorm Violations">Curfew & Dorm Violations</option>
                    <option value="Cleanliness & Personal Responsibility">Cleanliness & Personal Responsibility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-8">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="severity"
                        value="Low"
                        checked={newNote.severity === 'Low'}
                        onChange={(e) => setNewNote({ ...newNote, severity: e.target.value as NoteSeverity })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Low</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="severity"
                        value="Medium"
                        checked={newNote.severity === 'Medium'}
                        onChange={(e) => setNewNote({ ...newNote, severity: e.target.value as NoteSeverity })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">Medium</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="severity"
                        value="High"
                        checked={newNote.severity === 'High'}
                        onChange={(e) => setNewNote({ ...newNote, severity: e.target.value as NoteSeverity })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2">High</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    value={newNote.message}
                    onChange={(e) => setNewNote({ ...newNote, message: e.target.value })}
                    placeholder="Enter your note here..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full p-2 border rounded-md"
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <p className="text-sm text-gray-500">Uploading...</p>
                    )}
                    {uploadError && (
                      <p className="text-sm text-red-500">{uploadError}</p>
                    )}
                    {newNote.photo_url && (
                      <div className="mt-2">
                        <img
                          src={newNote.photo_url}
                          alt="Uploaded photo"
                          className="max-w-xs rounded-md"
                        />
                        <button
                          onClick={() => setNewNote(prev => ({ ...prev, photo_url: '' }))}
                          className="mt-2 text-sm text-red-500"
                        >
                          Remove photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsAddingNote(false)}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUploading}
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.note_id}
                className={`p-4 rounded-lg ${
                  note.note_type === 'Positive' ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      note.note_type === 'Positive' ? 'bg-green-200' : 'bg-red-200'
                    }`}>
                      {note.note_type}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">{note.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      note.severity === 'High' ? 'text-red-600' :
                      note.severity === 'Medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {note.severity} Severity
                    </span>
                    <IconButton size="small" color="primary" onClick={() => handleEditNote(note)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteNote(note.note_id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>
                <p className="text-gray-800">{note.message}</p>
                {note.photo_url && (
                  <img
                    src={note.photo_url}
                    alt="Note attachment"
                    className="mt-2 max-w-xs rounded-md"
                  />
                )}
                <div className="mt-2 text-sm text-gray-500">
                  {new Date(note.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Box>

      {/* Edit Note Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          {noteToEdit && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-8">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="edit_note_type"
                      value="Positive"
                      checked={noteToEdit.note_type === 'Positive'}
                      onChange={(e) => setNoteToEdit({ ...noteToEdit, note_type: e.target.value as NoteType })}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Positive</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="edit_note_type"
                      value="Negative"
                      checked={noteToEdit.note_type === 'Negative'}
                      onChange={(e) => setNoteToEdit({ ...noteToEdit, note_type: e.target.value as NoteType })}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Negative</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={noteToEdit.category}
                  onChange={(e) => setNoteToEdit({ ...noteToEdit, category: e.target.value as NoteCategory })}
                  required
                >
                  <option value="">Select a category...</option>
                  <option value="Group Participation">Group Participation</option>
                  <option value="Leadership Initiative">Leadership Initiative</option>
                  <option value="Spiritual Insight">Spiritual Insight</option>
                  <option value="Kindness/Service">Kindness/Service</option>
                  <option value="Attendance & Functionality">Attendance & Functionality</option>
                  <option value="Technology Misuse">Technology Misuse</option>
                  <option value="Group Behavior & Participation">Group Behavior & Participation</option>
                  <option value="Curfew & Dorm Violations">Curfew & Dorm Violations</option>
                  <option value="Cleanliness & Personal Responsibility">Cleanliness & Personal Responsibility</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-8">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="edit_severity"
                      value="Low"
                      checked={noteToEdit.severity === 'Low'}
                      onChange={(e) => setNoteToEdit({ ...noteToEdit, severity: e.target.value as NoteSeverity })}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Low</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="edit_severity"
                      value="Medium"
                      checked={noteToEdit.severity === 'Medium'}
                      onChange={(e) => setNoteToEdit({ ...noteToEdit, severity: e.target.value as NoteSeverity })}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Medium</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="edit_severity"
                      value="High"
                      checked={noteToEdit.severity === 'High'}
                      onChange={(e) => setNoteToEdit({ ...noteToEdit, severity: e.target.value as NoteSeverity })}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">High</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={4}
                  value={noteToEdit.message}
                  onChange={(e) => setNoteToEdit({ ...noteToEdit, message: e.target.value })}
                  placeholder="Enter your note here..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileUpload}
                    className="w-full p-2 border rounded-md"
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <p className="text-sm text-gray-500">Uploading...</p>
                  )}
                  {uploadError && (
                    <p className="text-sm text-red-500">{uploadError}</p>
                  )}
                  {noteToEdit.photo_url && (
                    <div className="mt-2">
                      <img
                        src={noteToEdit.photo_url}
                        alt="Note attachment"
                        className="max-w-xs rounded-md"
                      />
                      <button
                        onClick={() => setNoteToEdit({ ...noteToEdit, photo_url: '' })}
                        className="mt-2 text-sm text-red-500"
                      >
                        Remove photo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateNote} 
            color="primary" 
            variant="contained"
            disabled={isUploading}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this note? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 