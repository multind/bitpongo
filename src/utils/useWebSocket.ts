import { ref, type Ref } from 'vue';

interface WebSocketOptions {
  url?: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

export interface WebSocketReturn {
  ws: Ref<WebSocket | null>;
  currentPrices: Ref<Record<string, string>>;
  connect: (url: string, symbols: string[]) => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
}

export const useWebSocketBase = (options?: WebSocketOptions): WebSocketReturn => {
  const ws = ref<WebSocket | null>(null);
  const currentPrices = ref<Record<string, string>>({});

  const connect = (url: string, symbols: string[]) => {
    currentPrices.value = {};

    ws.value = new WebSocket(url);

    ws.value.onopen = () => {
      console.log('WebSocket连接已建立');
      ws.value?.send(
        JSON.stringify({
          action: 'subscribe',
          symbols,
          exchange: 'binance',
        }),
      );
    };

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.symbol && data.price !== undefined) {
          currentPrices.value = {
            ...currentPrices.value,
            [data.symbol]: data.price,
          };
        }
        options?.onMessage?.(data);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    };

    ws.value.onerror = (error) => {
      console.error('WebSocket错误:', error);
      options?.onError?.(error);
    };

    ws.value.onclose = (event) => {
      console.log('WebSocket连接已关闭');
      options?.onClose?.(event);
    };
  };

  const disconnect = () => {
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
  };

  const sendMessage = (message: any) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message));
    }
  };

  return {
    ws,
    currentPrices,
    connect,
    disconnect,
    sendMessage,
  };
};
