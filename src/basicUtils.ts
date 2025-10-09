import { type Intersection, type Group, type Object3D, Vector2, Vector3, BufferGeometry } from "three";

export function clamp(value: number, min = -1, max = 1) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

export const rad2deg = (value: number) => value * (180 / Math.PI);
export const deg2rad = (value: number) => (value * Math.PI) / 180;

/*interface GroupLog {
  name: string;
  children: GroupLog[];
}

export function logGroup(group: Group): GroupLog {
	const obj: GroupLog = {
		name: group.name,
		children: [],
	};
	for (let i = 0; i < group.children.length; i++) {
		const child = group.children[i];
		if (child.type === "Group") {
			obj.children.push(logGroup(child as Group));
		}
	}
	return obj;
}*/

export function findGroup(obj: Object3D, group: Group | null = null): Group | null {
	if ((obj as Group).isGroup) {
		group = obj as Group;
	}

	if (obj.parent === null || obj.parent.name === "craft") {
		return group;
	}

	return findGroup(obj.parent, group);
}

export function filterByName(intersections: Intersection[]) {
	return intersections.filter(
		(i) => i.object.name !== "" && i.object.name !== "ground" && i.object.name !== "grid" && i.object.name !== "text" && i.object.name !== "glowMesh"
	);
}

export function updatePointer(event: PointerEvent, domElement: HTMLElement, offset?: Vector2): Vector2 {
	const rect = domElement.getBoundingClientRect();
	const pointer = new Vector2();
	pointer.x = ((event.clientX + (offset ? offset.x : 0) - rect.left) / rect.width) * 2 - 1;
	pointer.y = (-(event.clientY + (offset ? offset.y : 0) - rect.top) / rect.height) * 2 + 1;
	return pointer;
}

export function calcButtonPos(index: number) {
	const angle = (index / 6) * 2 * Math.PI + -Math.PI / 6;
	const radius = 50;
	const x = radius * Math.cos(angle);
	const y = radius * Math.sin(angle);
	return new Vector2(x, y);
}

export function getBasis(object: Object3D) {
	const q = object.quaternion;
	const right = new Vector3(1, 0, 0).applyQuaternion(q).normalize();
	const up = new Vector3(0, 1, 0).applyQuaternion(q).normalize();
	const forward = new Vector3(0, 0, -1).applyQuaternion(q).normalize();
	return { right, up, forward };
}

export const getVertices = (geometry: BufferGeometry) => {
			if (!geometry) return [[], []];

			// берём все вершины
			const vertices = geometry.attributes.position.array;
			const index = geometry.index;

			// если есть индексы (обычно есть у плоскости/куба)
			const indices = index ? index.array : [];

			return [vertices, indices];
		};