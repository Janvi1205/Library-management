import type {
  Book,
  Member,
  BorrowRecord,
  LoginPayload,
  LoginResponse,
  IssueBookPayload,
  CreateBookPayload,
  CreateMemberPayload,
  ApiResponse,
  PaginatedBooksResponse,
  MemberHistoryResponse,
  ApiError,
  LibrarianUser,
} from '../types';

/**
 * Base URL for ShelfLife backend API.
 * Configurable via Vite environment variable VITE_API_URL (e.g. deployed on Render / Vercel).
 */
const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const BASE_URL = rawBaseUrl.replace(/\/$/, '');

const TOKEN_KEY = 'shelflife_jwt_token';
const LIBRARIAN_KEY = 'shelflife_librarian_user';

// ============================================================
// TOKEN & AUTHENTICATION LOCAL STORAGE HELPERS
// ============================================================

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getLibrarianProfile = (): LibrarianUser | null => {
  const data = localStorage.getItem(LIBRARIAN_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as LibrarianUser;
  } catch {
    return null;
  }
};

export const saveAuthSession = (token: string, librarian: LibrarianUser): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(LIBRARIAN_KEY, JSON.stringify(librarian));
};

export const clearAuthSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LIBRARIAN_KEY);
};

export const isAuthenticated = (): boolean => {
  return Boolean(getAuthToken());
};

// ============================================================
// CUSTOM API ERROR CLASS
// ============================================================

export class ShelfLifeApiError extends Error {
  public status: number;
  public details?: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.name = 'ShelfLifeApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Core HTTP Request Wrapper
 * Automatically serializes JSON, attaches Authorization headers when available,
 * and normalizes error responses into ShelfLifeApiError.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Attach JWT Bearer token if librarian is logged in
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorData = data as ApiError;
      const message = errorData.message || `Request failed with HTTP status ${res.status}`;
      throw new ShelfLifeApiError(message, res.status, errorData.errors);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ShelfLifeApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network error or backend unreachable';
    throw new ShelfLifeApiError(message, 500);
  }
}

// ============================================================
// TYPED API CLIENT METHODS
// ============================================================

export const apiClient = {
  /**
   * Librarian Login
   * POST /api/auth/login
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const data = await request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // Persist session locally upon successful login
    saveAuthSession(data.token, data.librarian);
    return data;
  },

  /**
   * Fetch Books (with pagination and genre filtering)
   * GET /api/books?page=1&limit=10&genre=fiction
   */
  async getBooks(params?: { page?: number; limit?: number; genre?: string }): Promise<PaginatedBooksResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.genre && params.genre.trim()) query.set('genre', params.genre.trim());

    const qs = query.toString();
    const endpoint = `/api/books${qs ? `?${qs}` : ''}`;
    return request<PaginatedBooksResponse>(endpoint, { method: 'GET' });
  },

  /**
   * Issue / Borrow a Book
   * POST /api/borrow (Protected by JWT)
   */
  async issueBook(payload: IssueBookPayload): Promise<ApiResponse<BorrowRecord>> {
    return request<ApiResponse<BorrowRecord>>('/api/borrow', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Return a Borrowed Book
   * POST /api/return/:borrowId (Protected by JWT)
   */
  async returnBook(borrowId: string): Promise<ApiResponse<BorrowRecord>> {
    return request<ApiResponse<BorrowRecord>>(`/api/return/${borrowId}`, {
      method: 'POST',
    });
  },

  /**
   * Fetch Member Borrow History
   * GET /api/members/:id/history
   */
  async getMemberHistory(memberId: string): Promise<MemberHistoryResponse> {
    return request<MemberHistoryResponse>(`/api/members/${memberId}/history`, {
      method: 'GET',
    });
  },

  /**
   * Add / Create a New Book
   * POST /api/books
   */
  async createBook(payload: CreateBookPayload): Promise<ApiResponse<Book>> {
    return request<ApiResponse<Book>>('/api/books', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Register / Create a New Member
   * POST /api/members
   */
  async createMember(payload: CreateMemberPayload): Promise<ApiResponse<Member>> {
    return request<ApiResponse<Member>>('/api/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Alias for backward compatibility
   * POST /api/members
   */
  async registerMember(payload: CreateMemberPayload): Promise<ApiResponse<Member>> {
    return this.createMember(payload);
  },
};
