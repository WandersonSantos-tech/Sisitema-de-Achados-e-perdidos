import { apiRequest } from './api';

export const messageService = {
  send: (itemId, data) => apiRequest(`/messages/items/${itemId}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  conversation: (itemId, interlocutorId) => apiRequest(`/messages/items/${itemId}/messages?${new URLSearchParams({ interlocutor_id: interlocutorId })}`),
};
