//  tắt quy tắc cấm sử dụng kiểu any
/* eslint-disable @typescript-eslint/no-explicit-any */

// Định nghĩa kiểu dl trả về từ Server
export interface ServerResponse {
    status: 'success' | 'error';
    event: string;
    data?: any;
    mes?: string;
}

type MessageListener = (data: ServerResponse) => void;
type OpenListener = () => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private url = 'wss://chat.longapp.io.vn/chat/chat';
    private listeners: MessageListener[] = [];
    private onOpenCallbacks: OpenListener[] = [];

    // Mở kết nối WebSocket
    public connect(): void {
        // Nếu đã kết nối rồi thì không kết nối lại nữa
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('Đã kết nối thành công tới WebSocket server');
            // khi connect thành công, chạy các hàm đang chờ
            this.onOpenCallbacks.forEach((cb) => cb());
            this.onOpenCallbacks = [];
        };

        // Khi nhận được dữ liệu từ server gửi về
        this.ws.onmessage = (event: MessageEvent) => {
            try {
                const response: ServerResponse = JSON.parse(event.data);
                // Bắn dữ liệu đó cho tất cả các component đang lắng nghe
                this.listeners.forEach((callback) => callback(response));
            } catch (error) {
                console.error('Lỗi parse JSON từ WebSocket:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('Mất kết nối WebSocket, đang thử kết nối lại sau 3 giây');
            this.ws = null;
            setTimeout(() => this.connect(), 3000);
        };
    }
    // kết nối ws xog mới gửi dl
    public onOpen(callback: OpenListener) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            callback();
        } else {
            this.onOpenCallbacks.push(callback);
        }
    }

    // Gửi request lên server
    public sendMessage(event: string, payload: Record<string, unknown>): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messagePacket = {
                action: 'onchat',
                data: {
                    event: event,
                    data: payload,
                },
            };
            this.ws.send(JSON.stringify(messagePacket));
        } else {
            console.error('WebSocket chưa sẵn sàng', event);
        }
    }

    // Nhận phản hồi tư server
    public addListener(callback: MessageListener): () => void {
        this.listeners.push(callback);
        // return về hàm hủy lắng nghe để dọn dẹp bộ nhớ khi tắt component
        return () => {
            this.listeners = this.listeners.filter((cb) => cb !== callback);
        };
    }
}

export const wsService = new WebSocketService();