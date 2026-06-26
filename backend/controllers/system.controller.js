export function system(req,res){

    res.json({

        success:true,

        system:"Ω SYD OMEGA 91717",

        modules:[
            "Dashboard",
            "Profile",
            "Academy",
            "Publishing",
            "Consultancy",
            "AI",
            "Analytics",
            "Search",
            "Wallet"
        ],

        status:"RUNNING"

    });

}
