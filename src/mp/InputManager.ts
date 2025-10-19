import { InputState } from '../types/GameTypes';

export class InputManager {
    private keys: Set<string> = new Set();
    private lastInputState: InputState = { hasInput: false };
    
    constructor() {
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        window.addEventListener('keydown', (event) => {
            this.keys.add(event.code);
        });
        
        window.addEventListener('keyup', (event) => {
            this.keys.delete(event.code);
        });
        
        // Prevent context menu on right click
        window.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    public getInputState(): InputState {
        const forward = (this.keys.has('KeyW') || this.keys.has('ArrowUp')) ? 1 : 
                       (this.keys.has('KeyS') || this.keys.has('ArrowDown')) ? -1 : 0;
        
        const right = (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ? 1 : 
                     (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ? -1 : 0;
        
        const jump = this.keys.has('Space');
        
        const hasInput = forward !== 0 || right !== 0 || jump;
        
        const inputState: InputState = {
            forward,
            right,
            jump,
            hasInput
        };
        
        // Log input changes for debugging
        if (hasInput && !this.lastInputState.hasInput) {
            console.log('Input started:', inputState);
        } else if (!hasInput && this.lastInputState.hasInput) {
            console.log('Input stopped');
        }
        
        this.lastInputState = inputState;
        return inputState;
    }
    
    public isKeyPressed(keyCode: string): boolean {
        return this.keys.has(keyCode);
    }
}
