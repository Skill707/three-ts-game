import { io, Socket } from "socket.io-client";
import type { GameState, PlayerState } from "./shared";

export class NetworkManager {
	private socket: Socket | null = null;
	private eventHandlers: Map<string, Function[]> = new Map();
	private lastPingTime = 0;
	private pingInterval: number | null = null;
	isHost: boolean = false;

	public async connect(serverUrl: string, nick: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.socket = io(serverUrl, {
				transports: ["websocket"],
				query: { nick },
			});

			this.socket.on("connect", () => {
				console.log("Connected to server:", this.socket!.id);
				this.startPingInterval();
				resolve();
			});

			this.socket.on("connect_error", (error) => {
				console.error("Connection failed:", error);
				reject(error);
			});

			this.socket.on("disconnect", () => {
				console.log("Disconnected from server");
				this.stopPingInterval();
			});

			// Game message handlers
			this.socket.on("gameState", (data: GameState) => {
				this.emit("gameState", data);
			});

			this.socket.on("playerJoined", (data: PlayerState) => {
				this.emit("playerJoined", data);
			});

			this.socket.on("playerLeft", (data: { playerId: string }) => {
				this.emit("playerLeft", data.playerId);
			});

			this.socket.on("playerUpdate", (data: PlayerState) => {
				this.emit("playerUpdate", data);
			});

			this.socket.on("pong", () => {
				const ping = performance.now() - this.lastPingTime;
				const pingElement = document.getElementById("ping");
				if (pingElement) {
					pingElement.textContent = Math.round(ping).toString();
				}
			});
		});
	}

	public disconnect(): void {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
		this.stopPingInterval();
	}

	/*public sendInput(inputState: InputState): void {
        if (this.socket) {
            this.socket.emit('input', inputState);
        }
    }*/

	public getSocketId(): string | null {
		return this.socket ? this.socket.id ?? null : null;
	}

	private startPingInterval(): void {
		this.pingInterval = setInterval(() => {
			if (this.socket) {
				this.lastPingTime = performance.now();
				this.socket.emit("ping");
			}
		}, 1000);
	}

	private stopPingInterval(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
	}

	// Event system
	public on(event: string, handler: Function): void {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, []);
		}
		this.eventHandlers.get(event)!.push(handler);
	}

	public off(event: string, handler: Function): void {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			const index = handlers.indexOf(handler);
			if (index !== -1) {
				handlers.splice(index, 1);
			}
		}
	}

	private emit(event: string, data?: any): void {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			handlers.forEach((handler) => handler(data));
		}
	}
}
