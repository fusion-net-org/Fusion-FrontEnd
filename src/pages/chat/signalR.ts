import * as signalR from '@microsoft/signalr';

export const connection = new signalR.HubConnectionBuilder()
  .withUrl('https://www.tuongnt14.xyz/chathub', {
    accessTokenFactory: () => getAccessToken(),
  })
  .withAutomaticReconnect()
  .build();

export async function joinGroup(conversationId: string) {
  if (connection.state !== signalR.HubConnectionState.Connected) await connection.start();

  await connection.invoke('JoinGroup', conversationId);
}

export async function leaveGroup(conversationId: string) {
  if (connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke('LeaveGroup', conversationId);
  }
}

const getAccessToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token ?? '';
  } catch {
    return '';
  }
};
