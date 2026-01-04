import * as signalR from '@microsoft/signalr';

export const connection = new signalR.HubConnectionBuilder()
  .withUrl("https://localhost:7160/chathub", {
    accessTokenFactory: () =>
      localStorage.getItem("token") || ""
  })
  .withAutomaticReconnect()
  .build();

  export async function joinGroup(conversationId: string) {
  if (connection.state !== signalR.HubConnectionState.Connected)
    await connection.start();

  await connection.invoke("JoinGroup", conversationId);
}

export async function leaveGroup(conversationId: string) {
  if (connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("LeaveGroup", conversationId);
  }
}