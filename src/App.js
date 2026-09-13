import './App.css';

import { useState } from 'react';
import { MainPage, RoomPage, ThreeDPage, SalesPage } from './pages';

const PAGE_COMPONENTS = {
  main: MainPage,
  room: RoomPage,
  '3d': ThreeDPage,
  sales: SalesPage,
};

function App() {
  const [page, setPage] = useState('main');
  const ActivePage = PAGE_COMPONENTS[page];

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
