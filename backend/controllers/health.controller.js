export function health(req,res){

    res.json({

        success:true,

        platform:"Ω SYD OMEGA 91717",

        backend:"ONLINE",

        timestamp:new Date().toISOString(),

        version:"1.0.0"

    });

}
