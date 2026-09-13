import { api } from './api';
import {
  ShareLinkItem,
  ShareAccessLogItem,
  CreateShareInput,
  PublicShareData,
} from '../types';

export const shareApi = {
  /**
   * Create a new share link
   */
  async createShare(input: CreateShareInput): Promise<ShareLinkItem> {
    const res = await api.post<{ success: boolean; data: ShareLinkItem }>('/share', input);
    return res.data.data;
  },

  /**
   * List all share links for current user
   */
  async getMyShares(params?: {
    fileId?: string;
    folderId?: string;
    productId?: string;
    productSectionId?: string;
    status?: 'active' | 'revoked' | 'expired';
  }): Promise<ShareLinkItem[]> {
    const res = await api.get<{ success: boolean; data: ShareLinkItem[] }>('/share/my-links', {
      params,
    });
    return res.data.data;
  },

  /**
   * Get access audit logs for a specific share link
   */
  async getShareLogs(shareLinkId: string): Promise<{
    shareLink: { id: string; title: string; token: string };
    logs: ShareAccessLogItem[];
  }> {
    const res = await api.get<{
      success: boolean;
      data: {
        shareLink: { id: string; title: string; token: string };
        logs: ShareAccessLogItem[];
      };
    }>(`/share/${shareLinkId}/logs`);
    return res.data.data;
  },

  /**
   * Revoke an active share link
   */
  async revokeShare(shareLinkId: string): Promise<ShareLinkItem> {
    const res = await api.patch<{ success: boolean; data: ShareLinkItem }>(
      `/share/${shareLinkId}/revoke`
    );
    return res.data.data;
  },

  /**
   * Restore a revoked share link
   */
  async restoreShare(shareLinkId: string): Promise<ShareLinkItem> {
    const res = await api.patch<{ success: boolean; data: ShareLinkItem }>(
      `/share/${shareLinkId}/restore`
    );
    return res.data.data;
  },

  /**
   * Delete a share link permanently
   */
  async deleteShare(shareLinkId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; data: { success: boolean; message: string } }>(
      `/share/${shareLinkId}`
    );
    return res.data.data;
  },

  /**
   * Public: Inspect shared link and fetch contents
   */
  async getPublicShare(token: string, password?: string): Promise<PublicShareData> {
    const headers: Record<string, string> = {};
    if (password) {
      headers['x-share-password'] = password;
    }
    const res = await api.get<{ success: boolean; data: PublicShareData }>(
      `/share/public/${token}`,
      { headers }
    );
    return res.data.data;
  },

  /**
   * Public: Unlock protected share link with password
   */
  async unlockPublicShare(
    token: string,
    password: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; data: { success: boolean; message: string } }>(
      `/share/public/${token}/unlock`,
      { password }
    );
    return res.data.data;
  },

  /**
   * Public: Fetch QR Code data URL
   */
  async getQrCode(token: string): Promise<{ shareUrl: string; qrDataUrl: string }> {
    const res = await api.get<{
      success: boolean;
      data: { shareUrl: string; qrDataUrl: string };
    }>(`/share/public/${token}/qr`);
    return res.data.data;
  },
};
