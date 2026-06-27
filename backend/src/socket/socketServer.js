// ============================================================================
// FILE: /backend/src/socket/socketServer.js
// NEW FILE
// ============================================================================

import { Server } from "socket.io";

let io;

export function initialize(server){

    io = new Server(server,{

        cors:{

            origin:"*",

            methods:["GET","POST"]

        }

    });

    io.on("connection",(socket)=>{

        console.log(

            "Ω Socket Connected:",

            socket.id

        );

        socket.on("join",(room)=>{

            socket.join(room);

        });

        socket.on("disconnect",()=>{

            console.log(

                "Disconnected:",

                socket.id

            );

        });

    });

}

export function emit(event,payload){

    if(!io) return;

    io.emit(event,payload);

}

export function emitUser(userId,event,payload){

    if(!io) return;

    io.to(userId).emit(event,payload);

}

export function emitFounder(payload){

    if(!io) return;

    io.to("founder").emit(

        "founder-event",

        payload

    );

}
