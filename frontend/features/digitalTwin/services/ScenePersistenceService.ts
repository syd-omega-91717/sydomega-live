// ============================================================================
// FILE:
// /frontend/features/digitalTwin/services/ScenePersistenceService.ts
// ============================================================================

import {SceneSerializer}

from "../engine/SceneSerializer";

import * as THREE from "three";

export class ScenePersistenceService{

    save(scene:THREE.Scene){

        return JSON.stringify(

            SceneSerializer.export(scene)

        );

    }

}
