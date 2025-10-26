const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.clearToken();
  }

  // Product endpoints
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  // User endpoints
  async getUserProfile(userId) {
    return this.request(`/users/${userId}`);
  }

  async updateUserProfile(userId, data) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Cart endpoints
  async getCart(userId) {
    return this.request(`/cart/${userId}`);
  }

  async addToCart(userId, item) {
    return this.request(`/cart/${userId}/add`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateCartItem(userId, itemId, quantity) {
    return this.request(`/cart/${userId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(userId, itemId) {
    return this.request(`/cart/${userId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(userId) {
    return this.request(`/cart/${userId}`, {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async getOrders(userId) {
    return this.request(`/orders/${userId}`);
  }

  async createOrder(userId, orderData) {
    return this.request(`/orders/${userId}`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }
}

export default new ApiService();

