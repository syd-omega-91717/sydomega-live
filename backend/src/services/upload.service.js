// ============================================================================
// FILE: /backend/src/services/upload.service.js
// NEW FILE
// ============================================================================

import path from "path";
import crypto from "crypto";

import * as Storage from "./storage.service.js";

export async function upload(bucket,file){

    const filename=

        crypto.randomUUID()

        +

        path.extname(file.originalname);

    const uploaded=await Storage.upload(

        bucket,

        filename,

        file.buffer

    );

    const url=await Storage.publicUrl(

        bucket,

        filename

    );

    return{

        ...uploaded,

        filename,

        url

    };

}
