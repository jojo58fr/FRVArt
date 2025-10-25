import React, { useState, useEffect, createContext } from 'react';

import 'primereact/resources/themes/bootstrap4-dark-blue/theme.css';
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css'; //icons
import 'primeflex/primeflex.css'; // flex


import API from './Api.js';

import { Outlet } from "react-router-dom";
import CloneTikTok from './CloneTikTok.jsx';

export const Context = createContext('');

function App() {

  API.onUpdate = function () {

  }

  useEffect(() => {

  }, [])

  return (<>
    <CloneTikTok/>
  </>)
}

export default App
