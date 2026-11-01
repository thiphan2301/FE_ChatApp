const WS_URL = 'wss://chat.longapp.io.vn/chat/chat';

type EventHandler = (data: unknown) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private connectCallbacks: Array<() => void> = [];
  private isConnecting = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      if (this.isConnecting) {
        this.connectCallbacks.push(resolve);
        return;
      }
      this.isConnecting = true;
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.connectCallbacks.forEach((cb) => cb());
        this.connectCallbacks = [];
        resolve();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            status: string;
            event: string;
            data?: unknown;
            mes?: string;
          };
          const eventHandlers = this.handlers.get(msg.event) ?? [];
          eventHandlers.forEach((h) => h(msg));
        } catch {
          // ignore non-JSON messages
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
      };
    });
  }

  send(payload: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  on(event: string, handler: EventHandler): void {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...existing, handler]);
  }

  off(event: string, handler: EventHandler): void {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, existing.filter((h) => h !== handler));
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }

  sendAction(event: string, data?: object): void {
    this.send({
      action: 'onchat',
      data: { event, ...(data ? { data } : {}) },
    });
  }
}

export const wsService = new WebSocketService();
