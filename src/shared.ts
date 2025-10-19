export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface PlayerState {
    id: string;
    nick: string;
    position: Vector3;
    rotation: Vector3;
}

export interface GameState {
    players: PlayerState[];
    timestamp: number;
}

export interface InputState {
    forward?: number;
    right?: number;
    jump?: boolean;
    hasInput: boolean;
}

export interface ServerMessage {
    type: 'gameState' | 'playerJoined' | 'playerLeft' | 'playerUpdate';
    data: any;
}

export interface ClientMessage {
    type: 'input' | 'ping';
    data: any;
}
