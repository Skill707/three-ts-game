import { JointData, type RigidBody } from "@dimforge/rapier3d";
import { type Intersection, type Group, type Object3D, Vector2, Vector3, Quaternion } from "three";

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

export function fixedJoint(body1: RigidBody, body2: RigidBody, anchor1?: Vector3, anchor2?: Vector3, frame1?: Quaternion, frame2?: Quaternion) {
	const pos1W = new Vector3(body1.translation().x, body1.translation().y, body1.translation().z);
	const pos2W = new Vector3(body2.translation().x, body2.translation().y, body2.translation().z);
	const rot1W = new Quaternion(body1.rotation().x, body1.rotation().y, body1.rotation().z, body1.rotation().w);
	const rot2W = new Quaternion(body2.rotation().x, body2.rotation().y, body2.rotation().z, body2.rotation().w);

	// локальная позиция body2 относительно body1
	const pos2L = pos2W.clone().sub(pos1W).applyQuaternion(rot1W.clone().invert());
	// локальная ориентация body2 относительно body1
	const rot2L = rot1W.clone().invert().multiply(rot2W);

	if (anchor1 && anchor2) {
		//body1.setTranslation(body2pos.sub(anchor1).add(anchor2), false);
	} else {
		/*const delta = new Vector3().subVectors(body1pos, body2pos);
		anchor1 = delta.clone().multiplyScalar(0.5);
		anchor2 = delta.clone().multiplyScalar(-0.5);*/
		anchor1 = pos2L;
		anchor2 = new Vector3(0, 0, 0);
	}
	frame1 = frame1 ?? rot2L;
	frame2 = frame2 ?? new Quaternion();
	//const invBody2 = body2rot.clone().invert();
	//frame2 = invBody2.multiply(body1rot).multiply(frame1);
	const params = JointData.fixed(anchor1, frame1, anchor2, frame2);
	const joint = world.createImpulseJoint(params, body1, body2, false);
	return joint;
}
