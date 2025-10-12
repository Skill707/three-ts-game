import type { WebGLRenderer } from "three";
import type { KeyMap } from "./types";

export default class Keyboard {
	keyMap: KeyMap = {};

	constructor(renderer: WebGLRenderer) {
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

	onDocumentKey = (e: KeyboardEvent) => {
		this.keyMap[e.code] = e.type === "keydown";
	};
}
