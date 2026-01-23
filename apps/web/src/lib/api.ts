import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = Cookies.get('accessToken');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(!skipAuth ? this.getAuthHeaders() : {}),
      ...fetchOptions.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && !skipAuth) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request with new token
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers: {
            ...headers,
            ...this.getAuthHeaders(),
          },
        });
        if (!retryResponse.ok) {
          throw await this.handleError(retryResponse);
        }
        return retryResponse.json();
      }
      // Refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      throw await this.handleError(response);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text);
  }

  private async handleError(response: Response): Promise<Error> {
    try {
      const error = await response.json();
      return new Error(error.message || 'An error occurred');
    } catch {
      return new Error(`HTTP Error: ${response.status}`);
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      Cookies.set('accessToken', data.accessToken, { expires: 1 / 96 }); // 15 min
      Cookies.set('refreshToken', data.refreshToken, { expires: 7 }); // 7 days
      return true;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async register(data: { email: string; password: string; restaurantName: string }) {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  }

  async login(data: { email: string; password: string }) {
    return this.fetch<{
      user: { id: string; email: string; role: string; restaurantId: string };
      restaurant: { id: string; name: string; slug: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  }

  async logout() {
    return this.fetch('/auth/logout', { method: 'POST' });
  }

  // Restaurant endpoints
  async getMyRestaurant() {
    return this.fetch('/restaurant/me');
  }

  async updateRestaurant(data: Record<string, unknown>) {
    return this.fetch('/restaurant/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async checkSlug(slug: string) {
    return this.fetch<{ available: boolean }>(`/restaurant/check-slug?slug=${slug}`);
  }

  async getAnalytics() {
    return this.fetch<{
      totalOrders: number;
      totalRevenue: number;
      todayOrders: number;
    }>('/restaurant/analytics');
  }

  // Category endpoints
  async getCategories() {
    return this.fetch<Array<Record<string, unknown>>>('/categories');
  }

  async createCategory(data: { name: string; nameAr?: string; sortOrder?: number }) {
    return this.fetch('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: { name?: string; nameAr?: string; sortOrder?: number }) {
    return this.fetch(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string) {
    return this.fetch(`/categories/${id}`, { method: 'DELETE' });
  }

  // Item endpoints
  async getItems(categoryId?: string) {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return this.fetch<Array<Record<string, unknown>>>(`/items${query}`);
  }

  async createItem(data: Record<string, unknown>) {
    return this.fetch('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(id: string, data: Record<string, unknown>) {
    return this.fetch(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(id: string) {
    return this.fetch(`/items/${id}`, { method: 'DELETE' });
  }

  async toggleItemAvailability(id: string) {
    return this.fetch(`/items/${id}/toggle-availability`, { method: 'PATCH' });
  }

  // Order endpoints
  async getOrders(page = 1, limit = 20) {
    return this.fetch<{
      data: Array<Record<string, unknown>>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/orders?page=${page}&limit=${limit}`);
  }

  async getOrder(id: string) {
    return this.fetch<Record<string, unknown>>(`/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.fetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getOrderWhatsApp(id: string, lang: 'ar' | 'en' = 'en') {
    return this.fetch<{ message: string; whatsappUrl: string }>(
      `/orders/${id}/whatsapp?lang=${lang}`
    );
  }

  // Public endpoints
  async getPublicRestaurant(slug: string) {
    return this.fetch(`/public/restaurants/${slug}`, { skipAuth: true });
  }

  async createPublicOrder(slug: string, data: Record<string, unknown>) {
    return this.fetch(`/public/restaurants/${slug}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  }

  // Offers endpoints
  async getOffers(activeOnly = false) {
    const query = activeOnly ? '?activeOnly=true' : '';
    return this.fetch<Array<Record<string, unknown>>>(`/offers${query}`);
  }

  async createOffer(data: Record<string, unknown>) {
    return this.fetch('/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOffer(id: string, data: Record<string, unknown>) {
    return this.fetch(`/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOffer(id: string) {
    return this.fetch(`/offers/${id}`, { method: 'DELETE' });
  }

  async toggleOffer(id: string) {
    return this.fetch(`/offers/${id}/toggle`, { method: 'PATCH' });
  }

  // Tables endpoints
  async getTables(activeOnly = false) {
    const query = activeOnly ? '?activeOnly=true' : '';
    return this.fetch<Array<Record<string, unknown>>>(`/tables${query}`);
  }

  async createTable(data: { number: number; name?: string; capacity?: number }) {
    return this.fetch('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createTablesBulk(data: { startNumber: number; count: number; capacity?: number }) {
    return this.fetch('/tables/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTable(id: string, data: { name?: string; capacity?: number; isActive?: boolean }) {
    return this.fetch(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTable(id: string) {
    return this.fetch(`/tables/${id}`, { method: 'DELETE' });
  }

  async toggleTable(id: string) {
    return this.fetch(`/tables/${id}/toggle`, { method: 'PATCH' });
  }

  async getTableQR(id: string) {
    return this.fetch<{ tableNumber: number; menuUrl: string; qrCodeUrl: string }>(
      `/tables/${id}/qr`
    );
  }

  // Upload endpoints
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = Cookies.get('accessToken');
    const response = await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    return response.json();
  }
}

export const api = new ApiClient(API_URL);
