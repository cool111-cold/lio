import './App.css';

import { useState } from 'react';
import { SaroLoginPage, SaroMainPage } from './pages';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('saro_token'));

  if (!token) {
    return (
      <SaroLoginPage
        onAuthenticated={(newToken) => {
          localStorage.setItem('saro_token', newToken);
          setToken(newToken);
        }}
      />
    );
  }

  return <SaroMainPage token={token} />;
}

export default App;
