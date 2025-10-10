import { ColliderDesc } from "@dimforge/rapier3d";
import { Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from "three";
import { resources } from "./main";
import type { CarParts } from "./types";

export function getCar() {
	const ferrari = resources.get("ferrari");
	const ferrari_model_root = ferrari.scene.children[0];
	(ferrari_model_root as Object3D).position.set(3, 0, 0);
	const carModel = (ferrari_model_root as Object3D).clone();
	carModel.traverse((o) => {
		o.castShadow = true;
		o.receiveShadow = true;
	});

	const bodyMaterial = new MeshPhysicalMaterial({
		color: 0xff0000,
		metalness: 1.0,
		roughness: 0.5,
		clearcoat: 1.0,
		clearcoatRoughness: 0.03,
	});

	const detailsMaterial = new MeshStandardMaterial({
		color: 0xffffff,
		metalness: 1.0,
		roughness: 0.5,
	});

	const glassMaterial = new MeshPhysicalMaterial({
		color: 0xffffff,
		metalness: 0.25,
		roughness: 0,
		transmission: 1.0,
	});

	(carModel.getObjectByName("body") as Mesh).material = bodyMaterial;
	(carModel.getObjectByName("rim_fl") as Mesh).material = detailsMaterial;
	(carModel.getObjectByName("rim_fr") as Mesh).material = detailsMaterial;
	(carModel.getObjectByName("rim_rr") as Mesh).material = detailsMaterial;
	(carModel.getObjectByName("rim_rl") as Mesh).material = detailsMaterial;
	(carModel.getObjectByName("trim") as Mesh).material = detailsMaterial;
	(carModel.getObjectByName("glass") as Mesh).material = glassMaterial;

	carModel.name = "carModel";

	const bodyMesh = carModel.getObjectByName("main") as Object3D;
	const wheelBLMesh = carModel.getObjectByName("wheel_rl") as Object3D;
	const wheelBRMesh = carModel.getObjectByName("wheel_rr") as Object3D;
	const wheelFLMesh = carModel.getObjectByName("wheel_fl") as Object3D;
	const wheelFRMesh = carModel.getObjectByName("wheel_fr") as Object3D;
	//const steering_wheel = carModel.getObjectByName("steering_wheel") as Object3D;

	const body_geometry = (carModel.getObjectByName("body") as Mesh).geometry;
	let body_collider = ColliderDesc.convexHull(body_geometry.attributes.position.array as Float32Array);

	if (body_collider) {
		const newQuaternion = new Quaternion();
		const fixX = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
		const fixY = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
		newQuaternion.multiply(fixY);
		newQuaternion.multiply(fixX);
		body_collider.setCollisionGroups(131073).setMass(1000).setRotation(newQuaternion);
	}

	body_collider = null;

	const carParts: CarParts = {
		rootPos: carModel.position.clone(),
		main: {
			model: bodyMesh,
			collider: body_collider ? body_collider : ColliderDesc.cuboid(1, 0.5, 2.3).setCollisionGroups(131073).setMass(1000),
		},
		wheels: [
			{
				model: wheelBLMesh,
				collider: ColliderDesc.roundCylinder(0.08, 0.3, 0.06)
					.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2))
					.setRestitution(0)
					.setFriction(2)
					.setMass(30)
					.setCollisionGroups(262145),
			},
			{
				model: wheelBRMesh,
				collider: ColliderDesc.roundCylinder(0.08, 0.3, 0.06)
					.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2))
					.setRestitution(0)
					.setFriction(2)
					.setMass(30)
					.setCollisionGroups(262145),
			},
			{
				model: wheelFLMesh,
				collider: ColliderDesc.roundCylinder(0.08, 0.3, 0.06)
					.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2))
					.setRestitution(0)
					.setFriction(2)
					.setMass(30)
					.setCollisionGroups(262145),
			},
			{
				model: wheelFRMesh,
				collider: ColliderDesc.roundCylinder(0.08, 0.3, 0.06)
					.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2))
					.setRestitution(0)
					.setFriction(2)
					.setMass(30)
					.setCollisionGroups(262145),
			},
			/*{
			model: steering_wheel,
			collider: ColliderDesc.roundCylinder(0.01, 0.15, 0.01)
				.setRestitution(0)
				.setFriction(2)
				.setMass(30)
				.setCollisionGroups(262145),
		},*/
		],
	};
	return carParts;
}
