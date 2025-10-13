import { Camera, Matrix4, Plane, Raycaster, Vector2, Vector3, type Object3D } from "three";

interface DragControlsParameters {
	objects: Object3D[];
	camera: Camera;
	domElement: HTMLCanvasElement;
	//dragEvents: DragEvents;
}

function updatePointer(event: PointerEvent, domElement: HTMLElement, offset?: Vector2): Vector2 {
	const rect = domElement.getBoundingClientRect();
	const pointer = new Vector2();
	pointer.x = ((event.clientX + (offset ? offset.x : 0) - rect.left) / rect.width) * 2 - 1;
	pointer.y = (-(event.clientY + (offset ? offset.y : 0) - rect.top) / rect.height) * 2 + 1;
	return pointer;
}

/*interface DragEvents {
	onDragStart: (part: Part) => void;
	onDragEnd: (part: Part) => void;
	onDrag: (intersections: Intersection[]) => void;
}*/

const _plane = new Plane();
const _worldPosition = new Vector3();
const _offset = new Vector3();
const _intersection = new Vector3();
const _inverseMatrix = new Matrix4();

export default class DragControls {
	public objects: Object3D[];

	private camera: Camera;
	private domElement: HTMLElement;
	private raycaster: Raycaster = new Raycaster();

	public selectedPart: Object3D | null = null;
	/*public dragEvents: DragEvents = {
		onDragStart: () => {},
		onDragEnd: () => {},
		onDrag: () => {},
	};*/

	constructor(parameters: DragControlsParameters) {
		this.objects = parameters.objects;

		this.camera = parameters.camera;
		this.domElement = parameters.domElement;
		//this.dragEvents = parameters.dragEvents;

		//this.raycaster.layers.disableAll();
		this.raycaster.far = 100;
		this.connect();
	}

	private onPointerMove = (event: PointerEvent) => {
		const pointer = updatePointer(event, this.domElement);
		this.raycaster.setFromCamera(pointer, this.camera);
		//this.raycaster.layers.set(8);

		if (this.selectedPart) {
			if (this.raycaster.ray.intersectPlane(_plane, _intersection)) {
				_intersection.sub(_offset).applyMatrix4(_inverseMatrix);
				this.selectedPart.position.copy(_intersection);
				this.domElement.style.cursor = "move";
			}
			//const intersections = this.raycaster.intersectObjects(this.objects);
			//this.dragEvents.onDrag(intersections);
		}
	};

	private onPointerDown = (event: PointerEvent) => {
		event.stopPropagation();
		if (event.buttons !== 2) return;

		const pointer = updatePointer(event, this.domElement);
		this.raycaster.setFromCamera(pointer, this.camera);
		//this.raycaster.layers.set(10);

		const intersections = this.raycaster.intersectObjects(this.objects);

		if (intersections.length > 0) this.selectedPart = intersections[0].object;

		if (this.selectedPart) {
			_plane.setFromNormalAndCoplanarPoint(
				this.camera.getWorldDirection(_plane.normal),
				_worldPosition.setFromMatrixPosition(this.selectedPart.matrixWorld)
			);
			if (this.raycaster.ray.intersectPlane(_plane, _intersection)) {
				if (this.selectedPart.parent) {
					_inverseMatrix.copy(this.selectedPart.parent.matrixWorld).invert();
					_offset.copy(_intersection).sub(_worldPosition.setFromMatrixPosition(this.selectedPart.matrixWorld));
				} else {
					throw new Error("Selected object has no parent");
				}
			}
			//this.dragEvents.onDragStart(this.selectedPart);
		}
	};

	private onPointerCancel = () => {
		//if (this.selectedPart) this.dragEvents.onDragEnd(this.selectedPart.userData as Part);
		this.selectedPart = null;
		this.domElement.style.cursor = "auto";
	};

	private onContextMenu = (event: MouseEvent) => {
		event.preventDefault();
	};

	public connect() {
		this.domElement.addEventListener("pointermove", this.onPointerMove);
		this.domElement.addEventListener("pointerdown", this.onPointerDown);
		this.domElement.addEventListener("pointerup", this.onPointerCancel);
		this.domElement.addEventListener("pointerleave", this.onPointerCancel);
		this.domElement.addEventListener("contextmenu", this.onContextMenu);
		this.domElement.style.touchAction = "none"; // disable touch scroll
	}

	public disconnect() {
		this.domElement.removeEventListener("pointermove", this.onPointerMove);
		this.domElement.removeEventListener("pointerdown", this.onPointerDown);
		this.domElement.removeEventListener("pointerup", this.onPointerCancel);
		this.domElement.removeEventListener("pointerleave", this.onPointerCancel);
		this.domElement.removeEventListener("contextmenu", this.onContextMenu);

		this.domElement.style.touchAction = "auto";
		this.domElement.style.cursor = "";
	}

	public reconnect() {
		this.disconnect();
		this.connect();
	}
}
