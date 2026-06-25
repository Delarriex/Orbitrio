import React, { useEffect } from "react";
import { useOrbit } from "../context/OrbitContext";

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export const TawkChat: React.FC = () => {
  const { user } = useOrbit();

  useEffect(() => {
    // 1. Initialize variables and custom style offsets
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Custom offsets to protect Orbitrio's sticky bottom navigation items on mobile devices
    window.Tawk_API.customStyle = {
      visibility: {
        desktop: {
          position: "br",
          xOffset: 20,
          yOffset: 20
        },
        mobile: {
          position: "br",
          xOffset: 15,
          yOffset: 85 // Elevation to gracefully float above our MobileNav bar buttons
        }
      }
    };

    // Pre-seed attributes on loaded visitor session
    if (user && user.isLoggedIn && user.email) {
      window.Tawk_API.visitor = {
        name: user.name || user.firstName || "Trader",
        email: user.email,
        id: user.email
      };
    } else {
      window.Tawk_API.visitor = {
        name: "Guest Trader",
        email: ""
      };
    }

    // 2. Safely load the script file asynchronously only once
    const existingScript = document.getElementById("tawk-script");
    if (!existingScript) {
      const s1 = document.createElement("script");
      s1.id = "tawk-script";
      s1.async = true;
      s1.src = "https://embed.tawk.to/6a395d28c9a6011d42f66d6c/1jro17q8a";
      s1.charset = "UTF-8";
      s1.setAttribute("crossorigin", "*");
      
      const s0 = document.getElementsByTagName("script")[0];
      if (s0 && s0.parentNode) {
        s0.parentNode.insertBefore(s1, s0);
      } else {
        document.head.appendChild(s1);
      }
    }
  }, []);

  const lastSyncedUser = React.useRef<string>("");

  // Reactive synchronizer to dynamically push data to Tawk dashboard
  useEffect(() => {
    if (window.Tawk_API) {
      if (user && user.isLoggedIn && user.email) {
        const detailsPayload = {
          name: user.name || user.firstName || "Trader",
          email: user.email,
          id: user.email,
          balance: user.balance,
          accountType: user.accountType || "Bronze",
          country: user.country || "N/A"
        };
        
        const payloadString = JSON.stringify(detailsPayload);
        if (payloadString === lastSyncedUser.current) return;

        if (typeof window.Tawk_API.setAttributes === "function") {
          window.Tawk_API.setAttributes(detailsPayload, (error: any) => {
            if (error) console.error("Tawk.to attributes synchronization failed:", error);
            else lastSyncedUser.current = payloadString;
          });
        } else {
          window.Tawk_API.visitor = {
            name: detailsPayload.name,
            email: detailsPayload.email,
            id: detailsPayload.id
          };
          lastSyncedUser.current = payloadString;
        }
      } else {
        // Fallback to clear attributes if customer logs out
        if (typeof window.Tawk_API.setAttributes === "function") {
          window.Tawk_API.setAttributes({
            name: "Guest Trader",
            email: "",
            id: ""
          }, () => { lastSyncedUser.current = ""; });
        }
      }
    }
  }, [user]);

  return null;
};
