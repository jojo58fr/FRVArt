import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import HttpsRedirect from "react-https-redirect";

import Root from "./routes/root.jsx";
import ErrorPage from "./error-page.jsx";
import App from './App.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    /*element: <Root/>,*/
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <App></App>
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <App /> */}
    <HttpsRedirect>
      <RouterProvider router={router} />
    </HttpsRedirect>
  </React.StrictMode>,
)
