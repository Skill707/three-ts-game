/* eslint-disable @typescript-eslint/no-explicit-any */
import { Texture, TextureLoader, LoadingManager, Object3D } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { HDRLoader } from "three/examples/jsm/Addons.js";

type ResourceType = "gltf" | "texture" | "json" | "custom"| "hdr";

interface ManifestItem {
	name: string;
	url: string;
	type: ResourceType;
	parser?: string;
}

export class ResourceLoader {
	private _manager: LoadingManager;
	private _cache = new Map<string, any>();
	private _manifest: ManifestItem[] = [];

	public onProgress?: (progress: number, url?: string) => void;
	public onLoad?: () => void;
	public onError?: (url: string, error: unknown) => void;

	constructor() {
		this._manager = new LoadingManager();

		this._manager.onProgress = (url, loaded, total) => {
			this.onProgress?.(loaded / total, url);
		};

		this._manager.onLoad = () => this.onLoad?.();
	}

	/** Загружает манифест (resources.json) */
	async loadManifest(url = "/resources.json") {
		const response = await fetch(url);
		this._manifest = await response.json();
	}

	/** Загружает все ресурсы из манифеста */
	async loadAll() {
		if (!this._manifest.length) console.log("Manifest is empty. Call loadManifest() first.");

		const promises = this._manifest.map((res) => this._loadAndCache(res));
		await Promise.all(promises);
	}

	get<T = any>(name: string): T {
		const res = this._cache.get(name);
		if (!res) throw new Error(`Resource "${name}" not found`);
		return res;
	}

	private async _loadAndCache(item: ManifestItem) {
		if (this._cache.has(item.name)) return this._cache.get(item.name);

		let raw: any;
		switch (item.type) {
			case "gltf":
				raw = await this._loadGLTF(item.url);
				break;
			case "texture":
				raw = await this._loadTexture(item.url);
				break;
			case "json":
				raw = await this._loadJSON(item.url);
				break;
			case "custom":
				raw = await this._loadCustom(item.url);
				break;
			case "hdr":
				raw = await this._loadHDR(item.url);
				break;
			default:
				throw new Error(`Unknown type: ${item.type}`);
		}

		const parsed = this._applyParser(raw, item.parser);
		this._cache.set(item.name, parsed);
		return parsed;
	}

	private _applyParser(raw: any, parser?: string): any {
		if (!parser) return raw;
		if (typeof parser !== "string") return raw;

		// Формат парсера: "meshByName:EngineMesh"
		const [type, arg] = parser.split(":");

		switch (type) {
			case "scene":
				return raw.scene;
			case "animations":
				return raw.animations;
			case "meshByName": {
				const mesh = raw.scene.children.find((c: Object3D) => c.name === arg);
				if (!mesh) throw new Error(`Mesh "${arg}" not found in GLTF`);
				return mesh;
			}
			default:
				console.warn(`Unknown parser: ${parser}`);
				return raw;
		}
	}

	private _loadGLTF(url: string): Promise<GLTF> {
		const loader = new GLTFLoader(this._manager);
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath("https://unpkg.com/three@0.180.0/examples/jsm/libs/draco/gltf/");
		loader.setDRACOLoader(dracoLoader);

		return new Promise((resolve, reject) => {
			loader.load(url, resolve, undefined, reject);
		});
	}

	private _loadTexture(url: string): Promise<Texture> {
		const loader = new TextureLoader(this._manager);
		return new Promise((resolve, reject) => {
			loader.load(url, resolve, undefined, reject);
		});
	}

	private _loadJSON(url: string): Promise<any> {
		return fetch(url).then((r) => r.json());
	}

	private _loadCustom(url: string): Promise<any> {
		return fetch(url).then((r) => r.blob());
	}

	private _loadHDR(url: string): Promise<Texture> {
		const loader = new HDRLoader(this._manager);
		return new Promise((resolve, reject) => {
			loader.load(url, resolve, undefined, reject);
		});
	}
}
