interface MessageEvent {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  text: string;
  sender_name?: string;
  sender_avatar?: string;
  created_at: string;
}

type MessageHandler = (message: MessageEvent) => boolean | void; // Return true to stop propagation

class MessageEventBus {
  private listeners: MessageHandler[] = [];

  emitNewMessage(message: MessageEvent) {
    // Call handlers in order - if one returns true, stop propagation
    for (const handler of this.listeners) {
      const stopPropagation = handler(message);
      if (stopPropagation === true) {
        console.log('📬 [Event Bus] Handler stopped propagation');
        break;
      }
    }
  }

  onNewMessage(handler: MessageHandler) {
    this.listeners.push(handler);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(handler);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

export const messageEventBus = new MessageEventBus();
