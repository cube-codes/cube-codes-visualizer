import { CubeSpecification, CubeState, Vector } from "@cube-codes/cube-codes-model";
import { CubeletRealisation } from "./CubeletRealisation";
import { Utils } from "./Utils";

export class CubeRealisation {

	private readonly cubeletsByInitialLocation: ReadonlyMap<string, CubeletRealisation>

	constructor(readonly spec: CubeSpecification, cubeState: CubeState) {

		const cubeletsByInitialLocation = new Map<string, CubeletRealisation>();
		for (const cubeletState of cubeState.cubelets) {
			cubeletsByInitialLocation.set(Utils.vectorId(cubeletState.initialLocation), new CubeletRealisation(this.spec, cubeletState));
		}

		this.cubeletsByInitialLocation = cubeletsByInitialLocation;

	}

	getCubelets(): IterableIterator<CubeletRealisation> {
		return this.cubeletsByInitialLocation.values();
	}

	getCubelet(initialLocation: Vector): CubeletRealisation | undefined {
		return this.cubeletsByInitialLocation.get(Utils.vectorId(initialLocation));
	}

}