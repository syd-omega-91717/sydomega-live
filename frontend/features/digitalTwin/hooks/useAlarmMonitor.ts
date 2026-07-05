// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/useAlarmMonitor.ts
// ============================================================================

'use client';

import {useEffect} from "react";

import {AlarmManager}

from "../engine/AlarmManager";

import {useAlarmStore}

from "../store/alarmStore";

export function useAlarmMonitor(){

    const setAlarms=

    useAlarmStore(

        s=>s.setAlarms

    );

    useEffect(()=>{

        const manager=

        new AlarmManager();

        const timer=

        setInterval(()=>{

            setAlarms(

                manager.active()

            );

        },1000);

        return()=>clearInterval(timer);

    },[setAlarms]);

}
