import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

interface SignalRService {
  connection: HubConnection | null;
  startConnection: (hubUrl: string) => void;
  onReceiveMessage: (callback: (user: string, message: string) => void) => void;
  sendMessage: (user: string, message: string) => void;
}

const signalRService: SignalRService = {
  connection: null,

  startConnection: (hubUrl: string) => {
    signalRService.connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .build();

    signalRService.connection.start().then(() => {
      console.log('SignalR connection established.');
    }).catch((err: Error) => {
      console.error('Error starting SignalR connection:', err);
    });
  },

  onReceiveMessage: (callback: (user: string, message: string) => void) => {
    signalRService.connection?.on('ReceiveMessage', (user: string, message: string) => {
      callback(user, message);
    });
  },

  sendMessage: (user: string, message: string) => {
    signalRService.connection?.invoke('SendMessage', user, message)
      .catch((err: Error) => {
        console.error('Error sending message:', err);
      });
  },
};

export default signalRService;
