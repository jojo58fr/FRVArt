import React, { useEffect, useMemo, useState, createContext } from 'react';

import 'primereact/resources/themes/bootstrap4-dark-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import API from './Api.js';

import CloneTikTok from './CloneTikTok.jsx';
import blueskyClient from './services/blueskyClient.js';

export const BlueskyContext = createContext({
  client: blueskyClient,
  session: null,
  isAuthenticated: false,
  pins: [],
});

function App() {
  const [session, setSession] = useState(null);
  const [pins, setPins] = useState(blueskyClient.getPinnedPosts());
  const [isAuthenticated, setIsAuthenticated] = useState(
    blueskyClient.isAuthenticated(),
  );

  useEffect(() => {
    API.onUpdate = function () {};
  }, []);

  useEffect(() => {
    let isMounted = true;
    blueskyClient.init().then(() => {
      if (!isMounted) return;
      setSession(blueskyClient.session);
      setIsAuthenticated(blueskyClient.isAuthenticated());
      setPins(blueskyClient.getPinnedPosts());
    });
    const unsubscribe = blueskyClient.subscribe((state) => {
      if (!isMounted) return;
      setSession(state.session ?? null);
      setIsAuthenticated(state.isAuthenticated);
      setPins(state.pins ?? []);
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      client: blueskyClient,
      session,
      isAuthenticated,
      pins,
    }),
    [session, isAuthenticated, pins],
  );

  return (
    <BlueskyContext.Provider value={contextValue}>
      <CloneTikTok />
    </BlueskyContext.Provider>
  );
}

export default App
