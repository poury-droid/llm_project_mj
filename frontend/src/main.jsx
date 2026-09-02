import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ApplicationProvider } from "./context/ApplicationContext.jsx";
import "./styles.css";

// BrowserRouter는 URL에 따라 화면 컴포넌트를 바꿔주는 React Router의 시작점입니다.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ApplicationProvider>
        <App />
      </ApplicationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
