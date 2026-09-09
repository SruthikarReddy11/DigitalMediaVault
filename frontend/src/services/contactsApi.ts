import { api } from './api';
import { SecureContact, ContactInput } from '../types';

const TOKEN_STORAGE_KEY = 'pdl_contacts_token';

class ContactsApiService {
  private unlockToken: string | null = null;

  constructor() {
    this.unlockToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  }

  public getUnlockToken(): string | null {
    if (!this.unlockToken) {
      this.unlockToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return this.unlockToken;
  }

  public setUnlockToken(token: string) {
    this.unlockToken = token;
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  public clearUnlockToken() {
    this.unlockToken = null;
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  public isUnlocked(): boolean {
    return !!this.getUnlockToken();
  }

  private getHeaders() {
    const token = this.getUnlockToken();
    return token ? { 'x-contacts-token': token } : {};
  }

  public async unlock(password: string): Promise<{ success: boolean; token: string }> {
    const res = await api.post<{
      success: boolean;
      data: { success: boolean; token: string; expiresInMinutes: number };
    }>('/contacts/unlock', { password });

    if (res.data?.data?.token) {
      this.setUnlockToken(res.data.data.token);
    }
    return res.data.data;
  }

  public lock(): void {
    this.clearUnlockToken();
  }

  public async getContacts(params?: {
    search?: string;
    type?: string;
    favoriteOnly?: boolean;
  }): Promise<SecureContact[]> {
    const res = await api.get<{ success: boolean; data: SecureContact[] }>('/contacts', {
      params,
      headers: this.getHeaders(),
    });
    return res.data.data;
  }

  public async createContact(data: ContactInput): Promise<SecureContact> {
    const res = await api.post<{ success: boolean; data: SecureContact }>('/contacts', data, {
      headers: this.getHeaders(),
    });
    return res.data.data;
  }

  public async updateContact(id: string, data: Partial<ContactInput>): Promise<SecureContact> {
    const res = await api.put<{ success: boolean; data: SecureContact }>(`/contacts/${id}`, data, {
      headers: this.getHeaders(),
    });
    return res.data.data;
  }

  public async deleteContact(id: string): Promise<{ success: boolean }> {
    const res = await api.delete<{ success: boolean; data: { success: boolean } }>(`/contacts/${id}`, {
      headers: this.getHeaders(),
    });
    return res.data.data;
  }

  public async toggleFavorite(id: string): Promise<SecureContact> {
    const res = await api.post<{ success: boolean; data: SecureContact }>(
      `/contacts/${id}/favorite`,
      {},
      { headers: this.getHeaders() }
    );
    return res.data.data;
  }
}

export const contactsApi = new ContactsApiService();
