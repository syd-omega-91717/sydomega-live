import db from "../database/database.js";

class StorageService{

    async upload(bucket,path,file,contentType){

        return db.storage(bucket).upload(path,file,{

            contentType,

            upsert:true

        });

    }

}

export default new StorageService();
