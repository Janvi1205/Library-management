import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, ShelfLifeApiError } from '../api/api';
import type { Book, Member } from '../types';
import { DataTable, type ColumnDef } from '../components/DataTable';
import { getActiveMembers } from '../mocks/members';
import { AddBookModal } from '../components/AddBookModal';
import { AddMemberModal } from '../components/AddMemberModal';

/**
 * Available book genres for dropdown filtering.
 */
const KNOWN_GENRES = [
  'All Genres',
  'Computer Science',
  'Fiction',
  'Software Engineering',
  'Mathematics',
  'History',
  'Science',
];

/**
 * Books Page Component
 *
 * Implements Question Q2(b) requirements:
 * 1. Fetches books from backend (GET /api/books)
 * 2. Displays books using the generic <DataTable<Book>> component
 * 3. Title search input box
 * 4. Case-insensitive title filtering
 * 5. Dropdown for genre filtering (synced with backend query / client filtering)
 * 6. Uses React useState and useEffect hooks
 * 7. Explicit loading spinner / state
 * 8. Clear error state with retry action
 * 9. Pagination controls (page, totalPages, limit)
 *
 * New Features:
 * 10. "+ Add New Book" modal dialog with automatic availableCopies = totalCopies
 * 11. "+ Add New Member" modal dialog for registering members in Member Directory
 * 12. Success feedback banners and live catalog / directory refresh
 *
 * Also implements Q2(e) Generic Reusable Component demonstration:
 * Uses <DataTable<Book>> for books and <DataTable<Member>> for the library members directory.
 */
export const Books: React.FC = () => {
  const navigate = useNavigate();

  // State management with useState
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filtering state
  const [searchTitle, setSearchTitle] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All Genres');

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalBooks, setTotalBooks] = useState<number>(0);

  // View mode tab: Catalog (Book) vs Members Directory (Member)
  const [activeTab, setActiveTab] = useState<'catalog' | 'members'>('catalog');

  // Registered members state (initialized from persistent/mock registry)
  const [members, setMembers] = useState<Member[]>(getActiveMembers());

  // Modal Dialog states
  const [isAddBookOpen, setIsAddBookOpen] = useState<boolean>(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast notification after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  /**
   * Fetch books from backend API with pagination and optional genre query
   */
  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const genreParam = selectedGenre === 'All Genres' ? undefined : selectedGenre;
      const response = await apiClient.getBooks({
        page,
        limit,
        genre: genreParam,
      });

      const bookList = Array.isArray(response?.data) ? response.data : [];
      setBooks(bookList);
      setTotalPages(response?.totalPages || 1);
      setTotalBooks(response?.totalBooks || bookList.length);
    } catch (err: unknown) {
      if (err instanceof ShelfLifeApiError) {
        setError(err.message);
      } else {
        setError('Failed to load books. Please ensure the backend server is running.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedGenre]);

  // Fetch whenever page or selected genre changes
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  /**
   * Callback when a new book is created via AddBookModal
   */
  const handleBookCreated = (newBook: Book) => {
    setToastMessage(`Book "${newBook.title}" added successfully to catalog!`);
    // Refresh catalog from backend to update counts and list
    loadBooks();
  };

  /**
   * Callback when a new member is created via AddMemberModal
   */
  const handleMemberCreated = (newMember: Member) => {
    setToastMessage(`Member "${newMember.name}" registered successfully!`);
    setMembers((prev) => [newMember, ...prev.filter((m) => m._id !== newMember._id)]);
  };

  /**
   * Filter books by Title on the client side in real-time.
   * Enables seamless live search by title while preserving backend genre and pagination.
   */
  const displayedBooks = useMemo(() => {
    const list = Array.isArray(books) ? books : [];
    if (!searchTitle.trim()) {
      return list;
    }
    const query = searchTitle.toLowerCase().trim();
    return list.filter((b) => b && b.title && b.title.toLowerCase().includes(query));
  }, [books, searchTitle]);

  // ============================================================
  // GENERIC DATATABLE CONFIGURATION FOR <DataTable<Book>>
  // ============================================================
  const bookColumns: ColumnDef<Book>[] = [
    {
      header: 'Title',
      accessor: 'title',
      render: (book) => (
        <div>
          <strong className="book-title-cell">{book.title}</strong>
          <div className="text-muted text-xs">ISBN: {book.ISBN}</div>
        </div>
      ),
    },
    {
      header: 'Author',
      accessor: 'author',
    },
    {
      header: 'Genre',
      accessor: 'genre',
      render: (book) => <span className="badge badge-secondary">{book.genre}</span>,
    },
    {
      header: 'Total Copies',
      accessor: 'totalCopies',
      align: 'center',
    },
    {
      header: 'Available Copies',
      accessor: 'availableCopies',
      align: 'center',
      render: (book) => {
        const isOutOfStock = book.availableCopies === 0;
        return (
          <span className={`copies-badge ${isOutOfStock ? 'copies-zero' : 'copies-available'}`}>
            {book.availableCopies} / {book.totalCopies}
          </span>
        );
      },
    },
    {
      header: 'Action',
      align: 'right',
      render: (book) => (
        <button
          type="button"
          onClick={() => navigate('/issue', { state: { selectedBookId: book._id } })}
          disabled={book.availableCopies === 0}
          className={`btn btn-sm ${book.availableCopies > 0 ? 'btn-primary' : 'btn-disabled'}`}
          title={book.availableCopies === 0 ? 'No copies available' : 'Issue this book'}
        >
          {book.availableCopies > 0 ? 'Issue Book' : 'Out of Stock'}
        </button>
      ),
    },
  ];

  // ============================================================
  // GENERIC DATATABLE CONFIGURATION FOR <DataTable<Member>>
  // Demonstrates Q2(e) generic reusability across another model
  // ============================================================
  const memberColumns: ColumnDef<Member>[] = [
    {
      header: 'Member Name',
      accessor: 'name',
      render: (m) => <strong>{m.name}</strong>,
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Membership Tier',
      accessor: 'membership',
      render: (m) => <span className="badge badge-info">{m.membership}</span>,
    },
    {
      header: 'Joined Date',
      accessor: 'joinedDate',
      render: (m) => new Date(m.joinedDate).toLocaleDateString(),
    },
    {
      header: 'History',
      align: 'right',
      render: (m) => (
        <button
          type="button"
          onClick={() => navigate(`/members/${m._id}/history`)}
          className="btn btn-outline-secondary btn-sm"
        >
          View Loan History →
        </button>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Top Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Library Catalog Management</h1>
          <p className="page-subtitle">Search, filter, and review real-time book inventory</p>
        </div>

        {/* Tab switch and Prominent Action Buttons */}
        <div className="header-actions-group">
          <div className="tab-pill-group">
            <button
              type="button"
              className={`tab-pill ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              📖 Book Catalog
            </button>
            <button
              type="button"
              className={`tab-pill ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              👥 Member Directory
            </button>
          </div>

          {/* Prominent + Add New Book button on Book Catalog */}
          {activeTab === 'catalog' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddBookOpen(true)}
            >
              + Add New Book
            </button>
          )}

          {/* Prominent + Add New Member button on Member Directory */}
          {activeTab === 'members' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddMemberOpen(true)}
            >
              + Add New Member
            </button>
          )}
        </div>
      </div>

      {/* Success Toast Notification */}
      {toastMessage && (
        <div className="toast-banner" role="status">
          <div className="toast-content">
            <span>✅</span>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add New Book Modal */}
      <AddBookModal
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        onBookCreated={handleBookCreated}
      />

      {/* Add New Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onMemberCreated={handleMemberCreated}
      />

      {activeTab === 'catalog' ? (
        <>
          {/* Search by title and Genre dropdown filter controls */}
          <div className="filter-card">
            <div className="filter-grid">
              <div className="search-input-wrap">
                <label htmlFor="search-title" className="filter-label">Search by Book Title</label>
                <input
                  id="search-title"
                  type="text"
                  className="form-control"
                  placeholder="🔍 Type title to filter (e.g. Algorithms, Mockingbird)..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                />
              </div>

              <div className="genre-select-wrap">
                <label htmlFor="genre-filter" className="filter-label">Filter by Genre</label>
                <select
                  id="genre-filter"
                  className="form-control"
                  value={selectedGenre}
                  onChange={(e) => {
                    setSelectedGenre(e.target.value);
                    setPage(1); // Reset to page 1 on genre change
                  }}
                >
                  {KNOWN_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="state-panel loading-panel">
              <div className="spinner"></div>
              <p>Fetching book catalog from server...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="state-panel error-panel">
              <div className="error-icon">⚠️</div>
              <h3>Unable to load catalog</h3>
              <p>{error}</p>
              <button type="button" onClick={loadBooks} className="btn btn-primary btn-sm">
                Try Again
              </button>
            </div>
          )}

          {/* Data State with Generic DataTable<Book> */}
          {!loading && !error && (
            <>
              <div className="catalog-meta">
                <span>
                  Showing <strong>{displayedBooks?.length || 0}</strong> of <strong>{totalBooks || 0}</strong> books
                  {selectedGenre !== 'All Genres' && ` in genre "${selectedGenre}"`}
                </span>
              </div>

              <DataTable<Book>
                data={displayedBooks || []}
                columns={bookColumns}
                keyExtractor={(book) => book._id}
                emptyMessage={
                  searchTitle
                    ? `No books match the search term "${searchTitle}".`
                    : 'No books found in this category.'
                }
              />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-bar">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    ← Previous
                  </button>
                  <span className="pagination-info">
                    Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Member Directory View: Reusing generic DataTable with <DataTable<Member>> */
        <div className="members-directory-panel">
          <div className="member-directory-header">
            <div>
              <h3>Registered Members Directory</h3>
              <p className="text-muted text-sm">
                Manage registered students, faculty, researchers, and campus staff
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddMemberOpen(true)}
            >
              + Add New Member
            </button>
          </div>

          <div className="info-banner">
            <span>
              ℹ️ <strong>Demonstrating Generic &lt;DataTable&lt;Member&gt;&gt; Component:</strong> This table reuses the exact same generic table component to render library members.
            </span>
          </div>

          <DataTable<Member>
            data={members}
            columns={memberColumns}
            keyExtractor={(m) => m._id}
            emptyMessage="No registered members found."
          />
        </div>
      )}
    </div>
  );
};
