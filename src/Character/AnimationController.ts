import type { AnimationAction } from "three";
import type Keyboard from "../Keyboard";
import type { ActionsGroup } from "../types";

export default class AnimationController {
	private wait = false;
	private animationActions: ActionsGroup;
	private activeAction?: AnimationAction;
	public speed = 0;
	private keyboard: Keyboard | null = null;

	constructor(animationActions: ActionsGroup, keyboard: Keyboard | null) {
		this.animationActions = animationActions;
		this.keyboard = keyboard;
		this.activeAction = this.animationActions["idle"];
	}

	private setAction(action: AnimationAction) {
		if (this.activeAction != action) {
			this.activeAction?.fadeOut(0.1);
			action.reset().fadeIn(0.1).play();
			this.activeAction = action;

			switch (action) {
				case this.animationActions["walk"]:
					this.speed = 5.25;
					break;
				case this.animationActions["run"]:
				case this.animationActions["jump"]:
					this.speed = 16;
					break;
				case this.animationActions["pose"]:
				case this.animationActions["idle"]:
					this.speed = 0;
					break;
				case this.animationActions["drive"]:
					this.speed = 0;
					break;
			}
		}
	}

	update(speed: number) {
		if (!this.wait && this.keyboard) {
			let actionAssigned = false;

			if (this.keyboard.keyMap["Space"]) {
				this.setAction(this.animationActions["jump"]);
				actionAssigned = true;
				this.wait = true; // blocks further actions until jump is finished
				setTimeout(() => (this.wait = false), 1200);
			}

			if (!actionAssigned && this.keyboard.keyMap["KeyW"] && this.keyboard.keyMap["ShiftLeft"]) {
				this.setAction(this.animationActions["run"]);
				actionAssigned = true;
			}

			if (!actionAssigned && this.keyboard.keyMap["KeyW"]) {
				this.setAction(this.animationActions["walk"]);
				actionAssigned = true;
			}

			if (
				!actionAssigned &&
				(this.keyboard.keyMap["KeyW"] || this.keyboard.keyMap["KeyA"] || this.keyboard.keyMap["KeyS"] || this.keyboard.keyMap["KeyD"]) &&
				this.keyboard.keyMap["ShiftLeft"]
			) {
				this.setAction(this.animationActions["run"]);
				actionAssigned = true;
			}

			if (
				!actionAssigned &&
				(this.keyboard.keyMap["KeyW"] || this.keyboard.keyMap["KeyA"] || this.keyboard.keyMap["KeyS"] || this.keyboard.keyMap["KeyD"])
			) {
				this.setAction(this.animationActions["walk"]);
				actionAssigned = true;
			}

			if (!actionAssigned && this.keyboard.keyMap["KeyQ"]) {
				this.setAction(this.animationActions["pose"]);
				actionAssigned = true;
			}

			!actionAssigned && this.setAction(this.animationActions["idle"]);
		} else {
			if (speed > 1) {
				this.setAction(this.animationActions["run"]);
			} else if (speed > 0.1) {
				this.setAction(this.animationActions["walk"]);
			} else {
				this.setAction(this.animationActions["idle"]);
			}
		}
	}
}
