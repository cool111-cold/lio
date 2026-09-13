import './App.css';

import { useState } from 'react';
import { MainPage, RoomPage, ThreeDPage } from './pages';

const PAGE_COMPONENTS = {
  main: MainPage,
  room: RoomPage,
  '3d': ThreeDPage,
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
