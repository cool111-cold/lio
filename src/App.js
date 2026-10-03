import './App.css';

import { useCallback, useState } from 'react';
import { MainPage, RoomPage, ThreeDPage, SalesPage, GetQrPage, GetQrAdminPage, GetQrAdminLoginPage, GetQrAdminStatsPage, CardsPage, MainQrPage, CrmPage, CrmLoginPage, VerifyEmailPage, ResetPasswordPage, MapPage, PrivacyPolicyPage, PersonalDataConsentPage } from './pages';

const PAGE_COMPONENTS = {
  main: MainPage,
  room: RoomPage,
  '3d': ThreeDPage,
  sales: SalesPage,
  qr: GetQrPage
};

const ADMIN_TOKEN_KEY = 'qr_admin_token';

const AdminGate = () => {
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));

  if (!token) {
    return (
      <GetQrAdminLoginPage
        onAuthenticated={(newToken) => {
          localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
          setToken(newToken);
        }}
      />
    );
  }

  const AdminPage = window.location.pathname.startsWith('/admin/stats') ? GetQrAdminStatsPage : GetQrAdminPage;

  return (
    <AdminPage
      token={token}
      onUnauthorized={() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
      }}
    />
  );
};

const CRM_TOKEN_KEY = 'crm_token';

const CrmGate = () => {
  const [token, setToken] = useState(() => localStorage.getItem(CRM_TOKEN_KEY));

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem(CRM_TOKEN_KEY);
    setToken(null);
  }, []);

  if (!token) {
    return (
      <CrmLoginPage
        onAuthenticated={(newToken) => {
          localStorage.setItem(CRM_TOKEN_KEY, newToken);
          setToken(newToken);
        }}
      />
    );
  }

  return <CrmPage token={token} onUnauthorized={handleUnauthorized} />;
};

function App() {
  const [page, setPage] = useState('qr');
  const ActivePage = PAGE_COMPONENTS[page];

  if (window.location.pathname === '/') {
    return <MainQrPage />;
  }

  if (window.location.pathname === '/privacy') {
    return <PrivacyPolicyPage />;
  }

  if (window.location.pathname === '/consent') {
    return <PersonalDataConsentPage />;
  }

  if (window.location.pathname.startsWith('/verify-email')) {
    return <VerifyEmailPage />;
  }

  if (window.location.pathname.startsWith('/reset-password')) {
    return <ResetPasswordPage />;
  }

  if (window.location.pathname.startsWith('/admin')) {
    return <AdminGate />;
  }

  if (window.location.pathname.startsWith('/crm')) {
    return <CrmGate />;
  }

  if (window.location.pathname.startsWith('/map')) {
    return <MapPage />;
  }

  if (window.location.pathname.startsWith('/cards/')) {
    return <CardsPage />;
  }

  if (/^\/\d+$/.test(window.location.pathname)) {
    return <ActivePage onNavigate={setPage} />;
  }

  return <MainQrPage />;
}


export default App;


// import './App.css';

// import { useState } from 'react';
// import { SaroLoginPage, SaroMainPage } from './pages';

// function App() {
//   const [token, setToken] = useState(() => localStorage.getItem('saro_token'));

//   if (!token) {
//     return (
//       <SaroLoginPage
//         onAuthenticated={(newToken) => {
//           localStorage.setItem('saro_token', newToken);
//           setToken(newToken);
//         }}
//       />
//     );
//   }

//   return (
//     <SaroMainPage
//       token={token}
//       onUnauthorized={() => {
//         localStorage.removeItem('saro_token');
//         setToken(null);
//       }}
//     />
//   );
// }

// export default App;
