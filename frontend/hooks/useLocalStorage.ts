// ============================================================================
// FILE:
// /frontend/hooks/useLocalStorage.ts
// ============================================================================

import { useEffect, useState } from "react";

export function useLocalStorage<T>(
    key: string,
    initialValue: T
) {

    const [value, setValue] = useState<T>(initialValue);

    useEffect(() => {

        const stored = localStorage.getItem(key);

        if (stored) {

            setValue(JSON.parse(stored));

        }

    }, [key]);

    const update = (newValue: T) => {

        setValue(newValue);

        localStorage.setItem(key, JSON.stringify(newValue));

    };

    return [value, update] as const;

}
