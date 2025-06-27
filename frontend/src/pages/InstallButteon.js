import React, { useState } from "react";
import "../style/InstallButton.css";

const InstallButton = () => {
  const [shop, setShop] = useState("sentimenthug.myshopify.com");

  const handleInstall = () => {
    if (!shop) {
      alert("Please enter your Shopify store URL!");
      return;
    }
    window.location.href = `/auth?shop=${shop}`;
  };

  return (
    <div className="install-container">
      <div className="install-card">
        <h1 className="install-title">Install Your Shopify App</h1>
        <input
          type="text"
          placeholder="sentimenthug.myshopify.com"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          className="install-input"
        />
        <button onClick={handleInstall} className="install-button">
          Install App && Login
        </button>
      </div>
    </div>
  );
};

export default InstallButton;
