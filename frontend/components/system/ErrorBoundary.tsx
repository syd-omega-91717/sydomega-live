// ============================================================================
// FILE:
// /frontend/components/system/ErrorBoundary.tsx
// ============================================================================

'use client';

import React

from "react";

export default class ErrorBoundary

extends React.Component<any,any>{

    constructor(props:any){

        super(props);

        this.state={

            hasError:false

        };

    }

    static getDerivedStateFromError(){

        return{

            hasError:true

        };

    }

    componentDidCatch(

        error:any,

        info:any

    ){

        console.error(

            error,

            info

        );

    }

    render(){

        if(

            this.state.hasError

        ){

            return(

                <h2>

                    Unexpected Error

                </h2>

            );

        }

        return this.props.children;

    }

}
