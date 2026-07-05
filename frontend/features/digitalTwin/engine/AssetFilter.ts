// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetFilter.ts
// ============================================================================

export interface Filter{

    status?:string;

    category?:string;

    search?:string;

}

export class AssetFilter{

    filter<T extends{

        status:string;

        category:string;

        name:string;

    }>(

        assets:T[],

        filter:Filter

    ){

        return assets.filter(asset=>{

            if(

                filter.status &&

                asset.status!==filter.status

            ) return false;

            if(

                filter.category &&

                asset.category!==filter.category

            ) return false;

            if(

                filter.search &&

                !asset.name

                .toLowerCase()

                .includes(

                    filter.search.toLowerCase()

                )

            ) return false;

            return true;

        });

    }

}
