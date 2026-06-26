import supabase from "../config/supabase.js";

class Database{

    table(name){

        return supabase.from(name);

    }

    storage(bucket){

        return supabase.storage.from(bucket);

    }

}

export default new Database();
