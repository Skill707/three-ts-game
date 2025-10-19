import { BoxGeometry, Mesh, MeshBasicMaterial, Quaternion, Vector3, Group } from "three";
import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d";
import { Entity } from "../Entity"; // Assuming Entity is still needed for Rapier integration
import { Brush, Evaluator, SUBTRACTION, ADDITION } from "three-bvh-csg";
import type Craft from "../Vehicle/Craft"; // Unchanged

type BuildingType = "HOUSE" | "APARTMENT" | "HANGAR" | "COTTAGE";

// Extend Entity to manage Rapier physics, and Group to manage Three.js objects
export class Building extends Entity {
    craft: Craft | null = null;
    wallWidth = 0.25;
    floorWidth = 0.25;
    roofHeight = 2; // For pitched roofs later
    type: BuildingType;
    parts: BuildingPart[] = [];
    position: Vector3 = new Vector3();
    rotation: Quaternion = new Quaternion();

    constructor(
        type: BuildingType = "HOUSE",
        position: Vector3 = new Vector3(),
        rotation: Quaternion = new Quaternion(),
        size: Vector3 = new Vector3(8, 6, 10) // Increased default size for better visual
    ) {
        super("building"); // Initialize Entity
        this.type = type;
        this.position.copy(position);
        this.rotation.copy(rotation);

        // This will be the main Three.js object for the building
        this.object = new Group();
        this.object.position.copy(this.position);
        this.object.quaternion.copy(this.rotation);
        this.object.name = `Building_${type}`;

        switch (type) {
            case "HOUSE":
                this.buildHouse(size);
                break;
            case "APARTMENT":
            // this.buildApartment(size);
                break;
            case "HANGAR":
            // this.buildHangar(size);
                break;
            case "COTTAGE":
            // this.buildCottage(size);
                break;
        }

        this.setupPhysics(); // Setup Rapier physics after building parts are assembled
    }

    private setupPhysics() {
        if (!this.object) return;

        // Create a single fixed rigid body for the entire building
        this.bodyDesc = RigidBodyDesc.fixed()
            .setTranslation(...this.position.toArray())
            .setRotation(this.rotation);

        // You'll need to generate a combined collider for the entire building
        // This is a placeholder and might require a more complex solution
        // depending on how you want to handle complex building colliders.
        // For simple cases, you might iterate through the meshes of this.object
        // and add individual colliders to the building's RigidBody, or use a single
        // complex collider from a merged geometry if performance allows.
        // For now, let's assume we can derive a bounding box for the whole group.
        // For CSG objects, extracting an accurate trimesh collider is the best bet.
        this.parts.forEach(part => {
            if (part.colliderDesc) {
                // If the part already has a collider (e.g., from CSG result), use it.
                // Note: In Rapier, colliders are attached to RigidBodies.
                // If 'this.object' is a Group, you might need to make each part's
                // mesh an entity with its own rigid body, or merge all geometry
                // for a single trimesh collider for the main building body.
                // For simplicity here, we'll assume individual parts have their
                // colliders added to the physics world by the main scene manager.
                // A better approach for a monolithic building would be to merge
                // all `result.geometry` into one for a single trimesh collider.
            }
        });
    }


    private buildHouse(size: Vector3) {
        const { x, y, z } = size;
        const w = this.wallWidth;
        const hf = this.floorWidth; // Height of floor/roof

        const material = new MeshBasicMaterial({ color: 0x888888, wireframe: false });
        const windowMaterial = new MeshBasicMaterial({ color: 0xADD8E6, transparent: true, opacity: 0.6 });
        const doorMaterial = new MeshBasicMaterial({ color: 0x654321 });

        // Floor
        const floor = new Floor(
            new Vector3(0, hf / 2, 0), // Position relative to building's origin
            new Quaternion(),
            new Vector3(x - w * 2, hf, z - w * 2),
            material
        );
        this.parts.push(floor);
        this.object!.add(floor); // Add to building's Three.js group

        // Walls (using more sophisticated Wall class)
        // Front Wall
        const frontWall = new Wall(
            new Vector3(0, y / 2 + hf, z / 2 - w / 2), // Adjusted for floor height
            new Quaternion(),
            new Vector3(x, y, w),
            material
        );
        // Add a door to the front wall
        const mainDoor = new Door(
            new Vector3(0, -y / 2 + 1.5, 0), // Relative to wall's center, adjust Y for door height
            new Quaternion(),
            new Vector3(1.5, 3, w * 2), // Door width, height, and depth (slightly thicker than wall)
            doorMaterial
        );
        frontWall.addOpening(mainDoor);
        this.parts.push(frontWall);
        this.object!.add(frontWall);

        // Back Wall
        const backWall = new Wall(
            new Vector3(0, y / 2 + hf, -z / 2 + w / 2),
            new Quaternion(),
            new Vector3(x, y, w),
            material
        );
        // Add a window to the back wall
        const backWindow = new Window(
            new Vector3(0, 0, 0), // Relative to wall's center
            new Quaternion(),
            new Vector3(2, 2, w * 2),
            windowMaterial
        );
        backWall.addOpening(backWindow);
        this.parts.push(backWall);
        this.object!.add(backWall);

        // Left Wall
        const leftWall = new Wall(
            new Vector3(-x / 2 + w / 2, y / 2 + hf, 0),
            new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2), // Corrected rotation
            new Vector3(z, y, w), // Swapped dimensions for correct wall orientation
            material
        );
        // Add two windows to the left wall
        const leftWindow1 = new Window(
            new Vector3(z / 4, 0.5, 0), // Relative to wall's center
            new Quaternion(),
            new Vector3(1.5, 1.5, w * 2),
            windowMaterial
        );
        const leftWindow2 = new Window(
            new Vector3(-z / 4, 0.5, 0), // Relative to wall's center
            new Quaternion(),
            new Vector3(1.5, 1.5, w * 2),
            windowMaterial
        );
        leftWall.addOpening(leftWindow1);
        leftWall.addOpening(leftWindow2);
        this.parts.push(leftWall);
        this.object!.add(leftWall);

        // Right Wall
        const rightWall = new Wall(
            new Vector3(x / 2 - w / 2, y / 2 + hf, 0),
            new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2), // Corrected rotation
            new Vector3(z, y, w), // Swapped dimensions
            material
        );
        // Add two windows to the right wall
        const rightWindow1 = new Window(
            new Vector3(z / 4, 0.5, 0), // Relative to wall's center
            new Quaternion(),
            new Vector3(1.5, 1.5, w * 2),
            windowMaterial
        );
        const rightWindow2 = new Window(
            new Vector3(-z / 4, 0.5, 0), // Relative to wall's center
            new Quaternion(),
            new Vector3(1.5, 1.5, w * 2),
            windowMaterial
        );
        rightWall.addOpening(rightWindow1);
        rightWall.addOpening(rightWindow2);
        this.parts.push(rightWall);
        this.object!.add(rightWall);


        // Flat Roof (for simplicity, a pitched roof would be more complex CSG)
        const roof = new Floor( // Re-using Floor for a simple flat roof
            new Vector3(0, y + hf + hf / 2, 0), // Positioned above walls
            new Quaternion(),
            new Vector3(x - w * 2, hf, z - w * 2),
            material
        );
        this.parts.push(roof);
        this.object!.add(roof);

        // After all parts are added, ensure their colliders are also created.
        // This is where you might want to merge geometries for a single collider.
        // For now, let's assume `Entity`'s `bodyDesc` and `colliderDesc` are handled
        // by the individual `BuildingPart`s, and the main `Building`'s physics is just
        // a fixed point, or we compute a compound collider.

        // For a more robust physics setup, you might consider:
        // 1. Merging all final mesh geometries into one, then creating a single Trimesh collider.
        // 2. Adding each individual BuildingPart's collider to the main Building's rigid body as a compound collider.
        // The latter is generally more flexible.
        this.parts.forEach(part => {
            // Assuming 'part' is also an Entity and has its own colliderDesc
            // You would add these colliders to the main building's RigidBody in your World class
            // or modify the Building class to manage a compound collider.
            // For example:
            // if (part.colliderDesc) {
            //     this.addCollider(part.colliderDesc.setTranslation(...part.object!.position.toArray())); // Adjust collider position relative to main body
            // }
        });

        // Finally, position and rotate the entire building group
        this.object.position.copy(this.position);
        this.object.quaternion.copy(this.rotation);
    }

    update(_delta: number): void {
        // Update logic for the whole building if needed
        this.parts.forEach(part => part.update(_delta));
    }
}

// Abstract base class for building parts, now extending THREE.Mesh directly
// and handling its own physics collider generation
abstract class BuildingPart extends Entity {
    protected evaluator: Evaluator = new Evaluator();
    public object: Mesh | Group | undefined; // Make object accessible and potentially a Group for sub-elements

    constructor(name: string = "buildingPart") {
        super(name);
    }

    update(_delta: number): void {
        // Specific update logic for a part if necessary
    }
}

// Floor and Roof will be simple brushes
export class Floor extends BuildingPart {
    constructor(
        position: Vector3 = new Vector3(),
        rotation: Quaternion = new Quaternion(),
        size: Vector3,
        material: MeshBasicMaterial
    ) {
        super("floor");

        const geometry = new BoxGeometry(size.x, size.y, size.z);
        const brush = new Brush(geometry, material);
        brush.position.copy(position);
        brush.quaternion.copy(rotation);
        this.object = brush; // The Brush is directly our object

        // Colliders for floors are typically fixed cuboids
        this.colliderDesc = ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
            .setTranslation(...position.toArray())
            .setRotation(rotation);
        this.bodyDesc = RigidBodyDesc.fixed()
            .setTranslation(...position.toArray())
            .setRotation(rotation);
    }
}

// Wall class now handles CSG for openings
export class Wall extends BuildingPart {
    private baseWall: Brush;
    private openings: Brush[] = [];
    private finalMesh: Mesh | undefined; // The mesh after CSG operations

    constructor(
        position: Vector3 = new Vector3(),
        rotation: Quaternion = new Quaternion(),
        size: Vector3,
        material: MeshBasicMaterial
    ) {
        super("wall");

        const geometry = new BoxGeometry(size.x, size.y, size.z);
        this.baseWall = new Brush(geometry, material);
        this.baseWall.position.copy(position);
        this.baseWall.quaternion.copy(rotation);

        this.object = this.baseWall; // Initially, the object is just the base wall brush

        // Store initial position/rotation for collider setup
        this.bodyDesc = RigidBodyDesc.fixed()
            .setTranslation(...position.toArray())
            .setRotation(rotation);
    }

    addOpening(openingBrush: Brush) {
        // Add opening brush relative to the wall's local space
        this.openings.push(openingBrush);
        this.rebuildWallMesh(); // Rebuild the mesh with the new opening
    }

    private rebuildWallMesh() {
        let currentBrush: Brush = this.baseWall;

        this.openings.forEach(opening => {
            // Apply opening's transform relative to the wall's current transform
            const transformedOpening = new Brush(opening.geometry, opening.material);
            transformedOpening.position.copy(opening.position);
            transformedOpening.quaternion.copy(opening.quaternion);

            // Perform subtraction
            const result = this.evaluator.evaluate(currentBrush, transformedOpening, SUBTRACTION);
            currentBrush.geometry.dispose(); // Clean up old geometry
            currentBrush = new Brush(result.geometry, result.material);
            currentBrush.position.copy(this.baseWall.position); // Maintain original wall position/rotation
            currentBrush.quaternion.copy(this.baseWall.quaternion);
        });

        if (this.finalMesh) {
            // If already a mesh, dispose of its geometry and replace
            this.finalMesh.geometry.dispose();
            this.finalMesh.material = currentBrush.material;
            this.finalMesh.geometry = currentBrush.geometry;
        } else {
            // Create the final mesh if it doesn't exist
            this.finalMesh = new Mesh(currentBrush.geometry, currentBrush.material);
            this.finalMesh.position.copy(this.baseWall.position);
            this.finalMesh.quaternion.copy(this.baseWall.quaternion);
            this.object = this.finalMesh; // Set the final mesh as the object
        }

        // Update collider based on the new geometry
        this.updateColliderFromMesh(this.finalMesh);
    }

    private updateColliderFromMesh(mesh: Mesh) {
        if (!mesh || !mesh.geometry) return;

        const geometry = mesh.geometry;
        geometry.computeVertexNormals(); // Ensure normals are computed for accurate physics
        geometry.computeBoundingBox();

        const vertices = geometry.attributes.position.array as Float32Array;
        const indices = geometry.index
            ? (geometry.index.array as Uint32Array)
            : new Uint32Array(Array.from({ length: vertices.length / 3 }, (_, i) => i));

        this.colliderDesc = ColliderDesc.trimesh(vertices, indices)
            .setTranslation(...this.object!.position.toArray())
            .setRotation(this.object!.quaternion);
    }
}

// Reusable Window brush
export class Window extends Brush {
    constructor(
        position: Vector3 = new Vector3(),
        rotation: Quaternion = new Quaternion(),
        size: Vector3,
        material: MeshBasicMaterial
    ) {
        super(new BoxGeometry(size.x, size.y, size.z), material);
        this.position.copy(position);
        this.quaternion.copy(rotation);
        this.name = "windowBrush";
    }
}

// Reusable Door brush
export class Door extends Brush {
    constructor(
        position: Vector3 = new Vector3(),
        rotation: Quaternion = new Quaternion(),
        size: Vector3,
        material: MeshBasicMaterial
    ) {
        super(new BoxGeometry(size.x, size.y, size.z), material);
        this.position.copy(position);
        this.quaternion.copy(rotation);
        this.name = "doorBrush";
    }
}

// You can remove WallWithWindow if Wall is now handling openings