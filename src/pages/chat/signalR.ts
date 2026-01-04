import * as signalR from '@microsoft/signalr';

export const connection = new signalR.HubConnectionBuilder()
  .withUrl('https://localhost:5001/chatHub') 
  .withAutomaticReconnect()
  .build();
