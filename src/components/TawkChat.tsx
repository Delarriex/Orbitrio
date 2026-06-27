import React, { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

export const TawkChat: React.FC = () => {
  useEffect(() => {
    // Basic Tawk.to initialization
    const initTawk = () => {
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();
      const s1 = document.createElement("script");
      const s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = "https://embed.tawk.to/669d270332d73318d18471b4/default";
      s1.charset = "UTF-8";
      s1.setAttribute("crossorigin", "*");
      if (s0 && s0.parentNode) {
        s0.parentNode.insertBefore(s1, s0);
      }
    };
    initTawk();
  }, []);

  return null;
};
