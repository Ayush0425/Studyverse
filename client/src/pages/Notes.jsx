import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_URL, BASE_URL } from '../services/api';
import { 
  Folder, 
  FileText, 
  Bookmark, 
  Search, 
  Plus, 
  X, 
  Upload, 
  Trash2, 
  ExternalLink,
  BookOpen,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Notes = () => {
  const { user } = useAuth();
  const folders = user?.subjects && user.subjects.length > 0
    ? ['General', ...user.subjects]
    : ['General', 'DSA', 'Web Technology', 'DBMS', 'Python'];

  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState('');
  const [filterBookmarked, setFilterBookmarked] = useState(false);

  // New Note Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFolder, setNewFolder] = useState('General');
  const [newContent, setNewContent] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Selected Note Viewer Drawer States
  const [selectedNote, setSelectedNote] = useState(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (activeFolder) query += `folder=${encodeURIComponent(activeFolder)}&`;
      if (filterBookmarked) query += `bookmarked=true&`;
      
      const data = await api.get(`/notes${query}`);
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes();
    }, 300); // debounce search query
    return () => clearTimeout(timer);
  }, [search, activeFolder, filterBookmarked]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    setIsUploading(true);

    if (!newTitle.trim()) {
      setUploadError('Title is required');
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('folder', newFolder);

      if (uploadFile) {
        formData.append('file', uploadFile);
      } else if (newContent.trim()) {
        formData.append('content', newContent);
        formData.append('fileType', 'text');
      } else {
        setUploadError('Please provide text content or select a file to upload.');
        setIsUploading(false);
        return;
      }

      await api.post('/notes', formData, true);
      
      // Reset form
      setNewTitle('');
      setNewFolder('General');
      setNewContent('');
      setUploadFile(null);
      setIsModalOpen(false);
      
      // Refresh list
      fetchNotes();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload note.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleBookmark = async (id, e) => {
    e.stopPropagation();
    try {
      const updated = await api.put(`/notes/${id}/bookmark`);
      setNotes(notes.map(n => n._id === id ? updated : n));
      if (selectedNote && selectedNote._id === id) {
        setSelectedNote(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter(n => n._id !== id));
      if (selectedNote && selectedNote._id === id) {
        setSelectedNote(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
      if (!newTitle) {
        // Auto-fill title from filename
        const filename = e.dataTransfer.files[0].name;
        setNewTitle(filename.substring(0, filename.lastIndexOf('.')) || filename);
      }
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-brand-bg px-4 md:px-8 py-6 md:py-8 relative flex">
      {/* Background glow */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Column */}
      <div className="flex-1 pr-4">
        
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-brand-neonPurple" />
              <span className="bg-gradient-to-r from-white via-brand-neonPurple to-brand-neonCyan bg-clip-text text-transparent pb-1">Notes Hub</span>
            </h1>
            <p className="text-brand-textMuted text-sm mt-1">
              Store notes, organize by folder, and generate AI quizzes instantly.
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-brand-neonCyan to-brand-neonPurple text-brand-bg font-black text-sm tracking-wide shadow-neon-cyan hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Upload Note
          </button>
        </div>

        {/* Filters Controls Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-textMuted">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes by title..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl glass-input text-sm"
            />
          </div>

          <button
            onClick={() => setFilterBookmarked(!filterBookmarked)}
            className={`px-5 py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 ${
              filterBookmarked 
                ? 'bg-brand-neonPink/20 border-brand-neonPink text-brand-neonPink shadow-neon-pink' 
                : 'bg-brand-surface/40 border-brand-accent/15 text-brand-textMuted hover:text-brand-text'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${filterBookmarked ? 'fill-current' : ''}`} />
            Bookmarked
          </button>
        </div>

        {/* Folders Navigation Bar */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-brand-textMuted mb-3 ml-1">
            Folders
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveFolder('')}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all duration-300 ${
                activeFolder === '' 
                  ? 'bg-brand-accent/30 border-brand-neonPurple text-brand-neonPurple shadow-neon-purple' 
                  : 'bg-brand-surface/40 border-brand-accent/15 text-brand-textMuted hover:text-brand-text'
              }`}
            >
              All Folders
            </button>
            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`px-4.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all duration-300 ${
                  activeFolder === folder
                    ? 'bg-brand-accent/30 border-brand-neonPurple text-brand-neonPurple shadow-neon-purple' 
                    : 'bg-brand-surface/40 border-brand-accent/15 text-brand-textMuted hover:text-brand-text'
                }`}
              >
                <Folder className="w-4 h-4 flex-shrink-0" />
                {folder}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="text-center py-12 text-brand-textMuted">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-brand-textMuted max-w-lg mx-auto mt-8 border-dashed">
            <FileText className="w-12 h-12 text-brand-accent/40 mx-auto mb-4" />
            <h3 className="font-bold text-brand-text mb-1">No Notes Found</h3>
            <p className="text-xs mb-6">Create a text note or upload files like PDFs or Images to get started.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-brand-accent/20 border border-brand-accent/50 text-brand-neonPurple text-xs font-bold uppercase tracking-wider hover:bg-brand-accent/30 transition-all"
            >
              Add Your First Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note._id}
                onClick={() => setSelectedNote(note)}
                className={`glass-panel p-5 rounded-2xl cursor-pointer hover:border-brand-accent/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[160px] relative ${
                  selectedNote?._id === note._id ? 'border-brand-neonPurple/55 shadow-neon-purple bg-brand-accent/5' : ''
                }`}
              >
                <div>
                  {/* Note header info */}
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-neonCyan px-2 py-0.5 bg-brand-neonCyan/10 border border-brand-neonCyan/25 rounded-md truncate max-w-[120px]">
                      {note.folder}
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleToggleBookmark(note._id, e)}
                        className={`text-brand-textMuted transition-colors p-1 hover:text-brand-neonPink`}
                      >
                        <Bookmark className={`w-4 h-4 ${note.bookmarked ? 'fill-brand-neonPink text-brand-neonPink' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteNote(note._id, e)}
                        className="text-brand-textMuted transition-colors p-1 hover:text-brand-neonPink"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base text-brand-text mt-3 line-clamp-2 pr-2">
                    {note.title}
                  </h3>
                </div>

                {/* Footer details */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-brand-accent/10">
                  <div className="flex items-center gap-1.5 text-brand-textMuted">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{note.fileType}</span>
                  </div>
                  <span className="text-[10px] text-brand-textMuted">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-out Drawer Panel (Selected Note details & AI Generator link) */}
      {selectedNote && (
        <div className="w-full sm:w-[380px] bg-brand-surface/95 border-l border-brand-accent/25 fixed top-0 right-0 h-screen shadow-2xl flex flex-col justify-between z-30 animate-slide-in">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-brand-accent/15 flex items-center justify-between">
            <button
              onClick={() => setSelectedNote(null)}
              className="flex items-center gap-1 text-xs text-brand-textMuted hover:text-brand-text"
            >
              <ArrowLeft className="w-4 h-4" />
              Close
            </button>

            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-neonPurple bg-brand-neonPurple/10 border border-brand-neonPurple/25 px-2 py-0.5 rounded-md">
              {selectedNote.folder}
            </span>
          </div>

          {/* Drawer Body - Scrollable content */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
            <h2 className="text-xl font-extrabold text-brand-text">
              {selectedNote.title}
            </h2>
            
            <span className="text-xs text-brand-textMuted">
              Created on: {new Date(selectedNote.createdAt).toLocaleString()}
            </span>

            <div className="mt-4 border border-brand-accent/15 bg-brand-bg/50 p-4 rounded-2xl flex-1 overflow-y-auto max-h-[360px] text-sm leading-relaxed text-brand-text">
              {selectedNote.fileType === 'text' ? (
                <p className="whitespace-pre-wrap">{selectedNote.content}</p>
              ) : selectedNote.fileType === 'image' ? (
                <div className="flex flex-col gap-3">
                  <img 
                    src={`${BASE_URL}${selectedNote.content}`} 
                    alt={selectedNote.title}
                    className="rounded-lg max-h-60 object-contain w-full bg-black/20"
                  />
                  <a
                    href={`${BASE_URL}${selectedNote.content}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand-neonCyan font-bold hover:underline"
                  >
                    View Full Image <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                  <FileText className="w-12 h-12 text-brand-neonPurple mb-3" />
                  <span className="font-bold text-xs uppercase tracking-wider text-brand-text block mb-2">PDF Document</span>
                  <a
                    href={`${BASE_URL}${selectedNote.content}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-brand-accent/20 border border-brand-accent/40 rounded-xl text-xs font-bold text-brand-neonPurple hover:bg-brand-accent/30 transition-all"
                  >
                    Open PDF File <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="p-6 border-t border-brand-accent/15 bg-brand-bg/20 flex gap-3">
            <button
              onClick={() => navigate('/quizzes', { state: { noteId: selectedNote._id } })}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-brand-neonCyan to-brand-neonPurple text-brand-bg text-xs font-black tracking-wider uppercase shadow-neon-cyan hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-brand-bg fill-current animate-pulse-glow" />
              Generate AI Quiz
            </button>
            
            <button
              onClick={(e) => handleToggleBookmark(selectedNote._id, e)}
              className="p-3.5 rounded-xl border border-brand-accent/15 bg-brand-surface text-brand-textMuted hover:text-brand-neonPink hover:border-brand-neonPink/30 transition-colors"
            >
              <Bookmark className={`w-5 h-5 ${selectedNote.bookmarked ? 'fill-brand-neonPink text-brand-neonPink' : ''}`} />
            </button>
          </div>

        </div>
      )}

      {/* Note Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-bg/85 backdrop-filter backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="w-full max-w-lg glass-panel-heavy rounded-3xl p-6 shadow-glass-glow relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setIsModalOpen(false); setUploadFile(null); setUploadError(''); }}
              className="absolute top-4 right-4 text-brand-textMuted hover:text-brand-text transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-extrabold text-brand-text mb-2 flex items-center gap-2.5">
              <Upload className="w-5 h-5 text-brand-neonPurple" />
              Add Note
            </h2>
            <p className="text-brand-textMuted text-xs mb-6">
              Write plain text or upload files (PDFs, Images) up to 10MB.
            </p>

            {uploadError && (
              <div className="mb-4 p-3 bg-brand-neonPink/10 border border-brand-neonPink/25 text-brand-neonPink rounded-xl text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-textMuted ml-1">
                  Note Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter a descriptive title..."
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-textMuted ml-1">
                  Folder
                </label>
                <select
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs bg-brand-surface cursor-pointer"
                >
                  {folders.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Upload drag drop zone / text select tabs */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-textMuted ml-1">
                  Content
                </label>
                
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                    uploadFile 
                      ? 'border-brand-neonCyan/50 bg-brand-neonCyan/5' 
                      : 'border-brand-accent/25 hover:border-brand-neonPurple bg-brand-bg/40'
                  }`}
                >
                  <input
                    type="file"
                    id="note-file-picker"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                        if (!newTitle) {
                          const filename = e.target.files[0].name;
                          setNewTitle(filename.substring(0, filename.lastIndexOf('.')) || filename);
                        }
                      }
                    }}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                  />
                  
                  <label htmlFor="note-file-picker" className="w-full cursor-pointer">
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${uploadFile ? 'text-brand-neonCyan animate-bounce' : 'text-brand-textMuted'}`} />
                    {uploadFile ? (
                      <div className="text-xs font-bold text-brand-text">
                        Selected: <span className="text-brand-neonCyan">{uploadFile.name}</span>
                        <span className="block text-[10px] text-brand-textMuted mt-1">({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <div className="text-xs text-brand-textMuted">
                        <span className="text-brand-neonPurple font-bold">Click to browse</span> or drag & drop files here
                        <span className="block text-[10px] mt-1.5">(PDF, PNG, JPG, or TXT)</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Plain Text input fallback (if no file is selected) */}
                {!uploadFile && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-[10px] text-brand-textMuted uppercase font-bold text-center block">OR write a text note</span>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Write notes contents directly here..."
                      className="w-full px-4 py-3 rounded-xl glass-input text-xs min-h-[100px] resize-y"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setUploadFile(null); setUploadError(''); }}
                  className="flex-1 py-3.5 rounded-xl border border-brand-accent/15 bg-brand-surface text-brand-textMuted text-xs font-bold uppercase tracking-wider hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-brand-neonCyan to-brand-neonPurple text-brand-bg text-xs font-black tracking-wider uppercase shadow-neon-cyan transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? 'Uploading...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
