// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/CullingManager.ts
// ============================================================================

import * as THREE from "three";

export class CullingManager{

    update(

        camera:THREE.Camera,

        objects:THREE.Object3D[]

    ){

        const frustum=

        new THREE.Frustum();

        const matrix=

        new THREE.Matrix4();

        matrix.multiplyMatrices(

            camera.projectionMatrix,

            camera.matrixWorldInverse

        );

        frustum.setFromProjectionMatrix(matrix);

        objects.forEach(object=>{

            object.visible=

            frustum.intersectsObject(

                object as THREE.Mesh

            );

        });

    }

}
