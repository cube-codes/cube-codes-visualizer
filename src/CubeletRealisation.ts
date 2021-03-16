import { CubeletState, CubeSpecification, Matrix, Vector } from "@cube-codes/cube-codes-model";
import { Group, Mesh, MeshBasicMaterial } from "three";
import { RoundedBoxBufferGeometry } from "./RoundedBoxBufferGeometry";
import { Utils } from "./Utils";

export class CubeletRealisation extends Group {

	readonly initialLocation: Vector

	constructor(readonly spec: CubeSpecification, cubeletState: CubeletState) {

		super();
		this.initialLocation = cubeletState.initialLocation;

		const maxComponent = (this.spec.edgeLength - 1) / 2;

		const initialLocationComponentLimit = cubeletState.initialLocation.components.map(c => c === maxComponent ? 1 : c === -maxComponent ? -1 : 0);

		const cubeletBaseEdgeLength = 1;
		const cubeletBaseEdgeRadius = 0.06;
		const cubeletBaseColor = 0x000000;

		const stickerEdgeLength = cubeletBaseEdgeLength - (2 * cubeletBaseEdgeRadius);
		const stickerEdgeRadius = 0.01;

		const cubeletBaseGeometry = new RoundedBoxBufferGeometry(cubeletBaseEdgeLength, cubeletBaseEdgeLength, cubeletBaseEdgeLength, cubeletBaseEdgeRadius, 10);
		const cubeletBaseMaterial = new MeshBasicMaterial({ color: cubeletBaseColor, transparent: true });
		const cubeletBase = new Mesh(cubeletBaseGeometry, cubeletBaseMaterial);

		const stickerGeometry = new RoundedBoxBufferGeometry(stickerEdgeLength, stickerEdgeLength, 2 * stickerEdgeRadius, stickerEdgeRadius, 10);

		this.add(cubeletBase);

		if (initialLocationComponentLimit[0] !== 0) {
			const stickerMaterial = new MeshBasicMaterial({ color: initialLocationComponentLimit[0] === 1 ? 0xba0c2f : 0xfe5000 });
			const sticker = new Mesh(stickerGeometry, stickerMaterial);
			this.add(sticker);
			sticker.rotateY(Math.PI / 2);
			sticker.position.set(0.5 * initialLocationComponentLimit[0], 0, 0);
		}

		if (initialLocationComponentLimit[1] !== 0) {
			const stickerMaterial = new MeshBasicMaterial({ color: initialLocationComponentLimit[1] === 1 ? 0xffffff : 0xffd700 });
			const sticker = new Mesh(stickerGeometry, stickerMaterial);
			this.add(sticker);
			sticker.rotateX(Math.PI / 2);
			sticker.position.set(0, 0.5 * initialLocationComponentLimit[1], 0);
		}

		if (initialLocationComponentLimit[2] !== 0) {
			const stickerMaterial = new MeshBasicMaterial({ color: initialLocationComponentLimit[2] === 1 ? 0x009a44 : 0x003da5 });
			const sticker = new Mesh(stickerGeometry, stickerMaterial);
			this.add(sticker);
			sticker.position.set(0, 0, 0.5 * initialLocationComponentLimit[2]);
		}

		this.setState(cubeletState);

	}

	setLocation(location: Vector): void {
		this.position.set(location.getX(), location.getY(), location.getZ());
	}

	setOrientation(orientation: Matrix): void {
		this.quaternion.setFromRotationMatrix(Utils.matrix4FromMatrix(orientation));
	}

	setState(newState: CubeletState): void {
		this.setLocation(newState.location);
		this.setOrientation(newState.orientation);
	}

}