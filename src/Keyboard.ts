import type { WebGLRenderer } from "three";

interface KeyMap {
	[key: string]: boolean;
}

export default class Keyboard {
	keyMap: KeyMap = {};

	constructor(renderer?: WebGLRenderer) {
		if (!renderer) return;
		document.addEventListener("pointerlockchange", () => {
			if (document.pointerLockElement === renderer.domElement) {
				document.addEventListener("keydown", this.onDocumentKey);
				document.addEventListener("keyup", this.onDocumentKey);
			} else {
				document.removeEventListener("keydown", this.onDocumentKey);
				document.removeEventListener("keyup", this.onDocumentKey);
			}
		});
	}

	private onDocumentKey = (e: KeyboardEvent) => {
		e.preventDefault();
		this.keyMap[e.code] = e.type === "keydown";
	};

	spaceDown() {
		this.keyMap["Space"] = true;
		return this
	}
}
