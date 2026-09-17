import './App.css';

import { useState } from 'react';
import { MainPage, RoomPage, ThreeDPage, SalesPage, GetQrPage, GetQrAdminPage, GetQrAdminLoginPage } from './pages';

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

  return (
    <GetQrAdminPage
      token={token}
      onUnauthorized={() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
      }}
    />
  );
};

function App() {
  const [page, setPage] = useState('qr');
  const ActivePage = PAGE_COMPONENTS[page];

  if (window.location.pathname.startsWith('/admin')) {
    return <AdminGate />;
  }

  return (
    <ActivePage onNavigate={setPage} />
  );
}

// тесты пайплайны метрика переовод 

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
