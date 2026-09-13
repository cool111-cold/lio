import { render, screen } from '@testing-library/react';
import { SalesPage } from '.';

describe('Загрузка страницы Sales', () => {

    test('страница успешно отрисовывается и показывает главный заголовок', () => {
      // 1. Рендерим всю страницу целиком
      render(<SalesPage />);
  
      // 2. страница загружается "
      const heading = screen.getByText(/Правила расчёта: приоритет, период действия и условия применения/i);
      expect(heading).toBeInTheDocument();

    });
  
    test('бэк жив', () => {
      render(<SalesPage />);
  
      const errorMessage = screen.queryByText(/failed to fetch/i);
      expect(errorMessage).not.toBeInTheDocument();
    });
  
  });