export interface INotification {
  id: string;
  event: string;
  title: string;
  body: string;
  context: string;
  linkUrl: string | null;
  linkUrlWeb: string | null;
  isRead: boolean;
  createAt: string;
  readAt: string | null;
}
