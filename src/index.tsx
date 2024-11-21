import React from "react";

import { createRoot } from "react-dom/client";

import App from "./App";
import { FetchConfig, GetConfig } from "./components/config";
import { AppContext } from "./AppContext";
import storage from "./storage";

await FetchConfig();

createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <AppContext.Provider value={GetConfig()}>
          <App />
        </AppContext.Provider>
      </React.StrictMode>
);
