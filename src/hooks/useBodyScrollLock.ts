import { useEffect } from "react";

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    const body = document.body;
    const root = document.documentElement;

    const previousBodyStyles = {
      overflow: body.style.overflow,
      overflowY: body.style.overflowY,
    };

    const previousRootStyles = {
      overflow: root.style.overflow,
      overflowY: root.style.overflowY,
    };

    body.style.overflow = "hidden";
    body.style.overflowY = "hidden";
    root.style.overflow = "hidden";
    root.style.overflowY = "hidden";

    return () => {
      body.style.overflow = previousBodyStyles.overflow;
      body.style.overflowY = previousBodyStyles.overflowY;
      root.style.overflow = previousRootStyles.overflow;
      root.style.overflowY = previousRootStyles.overflowY;
    };
  }, [isLocked]);
}
