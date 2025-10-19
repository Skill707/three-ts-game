import { Player } from "./Player";
import { InputManager } from "./InputManager";
import { NetworkManager } from "../NetworkManager";
import { GameState, PlayerState, ServerMessage, ClientMessage } from "../types/GameTypes";
import initScene from "./SceneInit";
import { Mesh, MeshLambertMaterial, PerspectiveCamera, PlaneGeometry, Scene, Vector3, WebGLRenderer } from "three";
import { ColliderDesc, RigidBody, RigidBodyDesc, World } from "@dimforge/rapier3d";

export class Game {
	private scene: Scene;
	private camera: PerspectiveCamera;
	private renderer: WebGLRenderer;
	private world: World | null = null;

	private players: Map<string, Player> = new Map();
	private localPlayer: Player | null = null;

	private inputManager: InputManager;
	private networkManager: NetworkManager;

	private container: HTMLElement;
	private isRunning = false;
	private lastTime = 0;
	private frameCount = 0;
	private lastFpsUpdate = 0;

	// Ground plane
	private ground: Mesh | null = null;
	private groundBody: RigidBody | null = null;

	constructor(container: HTMLElement) {
		this.container = container;

		// Initialize Three.js components
		const { scene, camera, renderer } = initScene();
		this.scene = scene;
		this.camera = camera;
		this.renderer = renderer;

		// Initialize managers

		this.inputManager = new InputManager();
		this.networkManager = new NetworkManager();

		this.container.appendChild(this.renderer.domElement);
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		// Network event listeners
		this.networkManager.on("gameState", this.onGameState.bind(this));
		this.networkManager.on("playerJoined", this.onPlayerJoined.bind(this));
		this.networkManager.on("playerLeft", this.onPlayerLeft.bind(this));
		this.networkManager.on("playerUpdate", this.onPlayerUpdate.bind(this));
	}

	public async initialize(): Promise<void> {
		// Dynamically import and initialize Rapier physics (compat version for Vite)

		const gravity = new Vector3(0.0, -9.81, 0.0);
		this.world = new World(gravity);

		// Create ground
		this.createGround();

		// Connect to server (same origin as the client)
		await this.networkManager.connect(window.location.origin);

		// Hide loading screen
		const loading = document.getElementById("loading");
		const ui = document.getElementById("ui");
		const instructions = document.getElementById("instructions");

		if (loading) loading.style.display = "none";
		if (ui) ui.style.display = "block";
		if (instructions) instructions.style.display = "block";

		console.log("Game initialized successfully");
	}

	private createGround(): void {
		if (!this.world) return;

		// Visual ground
		const groundGeometry = new PlaneGeometry(100, 100);
		const groundMaterial = new MeshLambertMaterial({ color: 0x90ee90 });
		this.ground = new Mesh(groundGeometry, groundMaterial);
		this.ground.rotation.x = -Math.PI / 2;
		this.ground.receiveShadow = true;
		this.scene.add(this.ground);

		// Physics ground
		const groundColliderDesc = ColliderDesc.cuboid(50, 0.1, 50);
		const groundRigidBodyDesc = RigidBodyDesc.fixed();
		this.groundBody = this.world.createRigidBody(groundRigidBodyDesc);
		this.world.createCollider(groundColliderDesc, this.groundBody);
	}

	public start(): void {
		this.isRunning = true;
		this.lastTime = performance.now();
		this.gameLoop();
	}

	private gameLoop(): void {
		if (!this.isRunning) return;

		const currentTime = performance.now();
		const deltaTime = (currentTime - this.lastTime) / 1000;
		this.lastTime = currentTime;

		this.update(deltaTime);
		this.render();
		this.updateFPS();

		requestAnimationFrame(() => this.gameLoop());
	}

	private update(deltaTime: number): void {
		// Update physics
		if (this.world) {
			this.world.step();
		}

		// Handle input and send to server
		if (this.localPlayer) {
			const inputState = this.inputManager.getInputState();
			if (inputState.hasInput) {
				this.networkManager.sendInput(inputState);
			}
		}

		// Update all players
		this.players.forEach((player) => {
			player.update(deltaTime);
		});

		// Update camera to follow local player
		if (this.localPlayer) {
			const playerPos = this.localPlayer.getPosition();
			this.camera.position.x = playerPos.x;
			this.camera.position.z = playerPos.z + 15;
			this.camera.lookAt(playerPos.x, playerPos.y + 2, playerPos.z);
		}
	}

	private render(): void {
		this.renderer.render(this.scene, this.camera);
	}

	private updateFPS(): void {
		this.frameCount++;
		const now = performance.now();

		if (now - this.lastFpsUpdate >= 1000) {
			const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
			const fpsElement = document.getElementById("fps");
			if (fpsElement) fpsElement.textContent = fps.toString();

			this.frameCount = 0;
			this.lastFpsUpdate = now;
		}
	}

	// Network event handlers
	private onGameState(gameState: GameState): void {
		// Update player count
		const playerCountElement = document.getElementById("playerCount");
		if (playerCountElement) {
			playerCountElement.textContent = gameState.players.length.toString();
		}

		// Update or create players
		gameState.players.forEach((playerState) => {
			if (!this.players.has(playerState.id)) {
				this.createPlayer(playerState);
			} else {
				const player = this.players.get(playerState.id);
				if (player) {
					player.updateFromState(playerState);
				}
			}
		});

		// Remove players that are no longer in the game
		const currentPlayerIds = new Set(gameState.players.map((p) => p.id));
		this.players.forEach((player, id) => {
			if (!currentPlayerIds.has(id)) {
				this.removePlayer(id);
			}
		});
	}

	private onPlayerJoined(playerState: PlayerState): void {
		this.createPlayer(playerState);
	}

	private onPlayerLeft(playerId: string): void {
		this.removePlayer(playerId);
	}

	private onPlayerUpdate(playerState: PlayerState): void {
		const player = this.players.get(playerState.id);
		if (player) {
			player.updateFromState(playerState);
		}
	}

	private createPlayer(playerState: PlayerState): void {
		if (!this.world) return;

		const isLocal = playerState.id === this.networkManager.getSocketId();
		const player = new Player(playerState.id, this.scene, this.world, isLocal);
		player.updateFromState(playerState);

		this.players.set(playerState.id, player);

		if (isLocal) {
			this.localPlayer = player;
		}

		console.log(`Player ${playerState.id} ${isLocal ? "(local)" : "(remote)"} joined the game`);
	}

	private removePlayer(playerId: string): void {
		const player = this.players.get(playerId);
		if (player) {
			player.destroy();
			this.players.delete(playerId);

			if (this.localPlayer && this.localPlayer.getId() === playerId) {
				this.localPlayer = null;
			}

			console.log(`Player ${playerId} left the game`);
		}
	}

	public destroy(): void {
		this.isRunning = false;

		// Clean up players
		this.players.forEach((player) => player.destroy());
		this.players.clear();

		// Clean up physics
		if (this.world) {
			this.world.free();
			this.world = null;
		}

		// Clean up Three.js
		this.renderer.dispose();

		// Clean up network
		this.networkManager.disconnect();
	}
}
