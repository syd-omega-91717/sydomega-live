// ============================================================================
// FILE:
// /frontend/lib/storage.ts
// ============================================================================

class StorageService{

    set(key:string,value:any){

        localStorage.setItem(

            key,

            JSON.stringify(value)

        );

    }

    get<T>(key:string):T|null{

        const value=

            localStorage.getItem(key);

        if(!value){

            return null;

        }

        return JSON.parse(value);

    }

    remove(key:string){

        localStorage.removeItem(key);

    }

    clear(){

        localStorage.clear();

    }

}

export default new StorageService();
