// ============================================================================
// FILE:
// /frontend/lib/logger.ts
// ============================================================================

export enum LogLevel{

    INFO="INFO",

    WARN="WARN",

    ERROR="ERROR",

    DEBUG="DEBUG"

}

export class Logger{

    info(message:string,...args:any[]){

        console.info(

            `[INFO] ${message}`,

            ...args

        );

    }

    warn(message:string,...args:any[]){

        console.warn(

            `[WARN] ${message}`,

            ...args

        );

    }

    error(message:string,...args:any[]){

        console.error(

            `[ERROR] ${message}`,

            ...args

        );

    }

    debug(message:string,...args:any[]){

        if(process.env.NODE_ENV==="development"){

            console.debug(

                `[DEBUG] ${message}`,

                ...args

            );

        }

    }

}

export default new Logger();
