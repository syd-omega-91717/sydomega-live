import db from "../database/database.js";

export default class BaseRepository{

    constructor(table){

        this.table=table;

    }

    async findAll(){

        return db.table(this.table).select("*");

    }

    async findById(id){

        return db
            .table(this.table)
            .select("*")
            .eq("id",id)
            .single();

    }

    async create(data){

        return db
            .table(this.table)
            .insert(data)
            .select();

    }

    async update(id,data){

        return db
            .table(this.table)
            .update(data)
            .eq("id",id)
            .select();

    }

    async delete(id){

        return db
            .table(this.table)
            .delete()
            .eq("id",id);

    }

}
