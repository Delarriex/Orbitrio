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
      window.Tawk_API.customStyle = {
        visibility: {
          mobile: {
            position: 'br',
            xOffset: '15',
            yOffset: '90' // Shift up by 90px on mobile to avoid bottom nav bar
          }
        }
      };
      window.Tawk_LoadStart = new Date();
      const s1 = document.createElement("script");
      const s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = "https://embed.tawk.to/6a395d28c9a6011d42f66d6c/1jro17q8a";
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
