// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/InstancedMeshManager.ts
// ============================================================================

import * as THREE from "three";

export class InstancedMeshManager{

    create(

        geometry:THREE.BufferGeometry,

        material:THREE.Material,

        count:number

    ){

        const mesh=

        new THREE.InstancedMesh(

            geometry,

            material,

            count

        );

        mesh.instanceMatrix.setUsage(

            THREE.DynamicDrawUsage

        );

        return mesh;

    }

    update(

        mesh:THREE.InstancedMesh,

        index:number,

        matrix:THREE.Matrix4

    ){

        mesh.setMatrixAt(

            index,

            matrix

        );

        mesh.instanceMatrix.needsUpdate=true;

    }

}
