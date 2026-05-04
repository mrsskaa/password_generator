import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Table, Dropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../components/Header/Header';
import type { AppDispatch, RootState } from '../../store/store';
import { loginSuccess } from '../../store/authSlice';
import {
  fetchCurrentUser,
  getAxiosErrorMessage,
  getSavedPasswordsRequest,
  type SavePasswordResponse,
} from '../../api/authApi';
import './MyPasswords.css';
import ContentBox from '../../components/ContentBox/ContentBox';

const PAGE_SIZE = 5;

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ru-RU').format(parsed);
}

function maskPassword(value: string): string {
  return '•'.repeat(Math.max(8, value.length));
}

// Примерные тестовые пароли
const TEST_PASSWORDS: SavePasswordResponse[] = [
  {
    id: "p1",
    description: "GitHub",
    password: "gh-password-super-secure-123",
    created_at: "2025-12-10T12:34:56Z",
  },
  {
    id: "p2",
    description: "Yandex.Mail",
    password: "ymail-secret-456",
    created_at: "2025-11-15T16:20:10Z",
  },
  {
    id: "p3",
    description: "Bank account",
    password: "bank-pass-789",
    created_at: "2025-10-05T09:15:22Z",
  },
  {
    id: "p4",
    description: "Netflix",
    password: "netflix-cool-000",
    created_at: "2025-09-20T18:45:33Z",
  },
  {
    id: "p5",
    description: "Work VPN",
    password: "work-vpn-xyz",
    created_at: "2025-08-12T11:11:11Z",
  },
  {
    id: "p6",
    description: "Cloud storage",
    password: "cloud-storage-abc",
    created_at: "2026-01-03T14:40:25Z",
  },
];

function MyPasswords() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const flashMessage = (location.state as { flashMessage?: string } | null)?.flashMessage;

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SavePasswordResponse[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [isCheckingSession, setIsCheckingSession] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      setIsCheckingSession(false);
      return;
    }

    setIsCheckingSession(true);
    void fetchCurrentUser()
      .then((user) => {
        if (user) {
          dispatch(loginSuccess(user));
          return;
        }
        navigate('/login', { replace: true });
      })
      .finally(() => {
        setIsCheckingSession(false);
      });
  }, [dispatch, isAuthenticated, navigate]);

  useEffect(() => {
    if (isCheckingSession || !isAuthenticated) {
      return;
    }

    setError('');
    void getSavedPasswordsRequest()
      .then((data) => {
        // Гарантируем, что data — массив
        const safeData = Array.isArray(data) ? data : [];
        // setItems(safeData);


        // Если data пустой, можно использовать тестовые пароли
        setItems(safeData.length > 0 ? safeData : TEST_PASSWORDS);
      })
      .catch((e) => {
        setError(getAxiosErrorMessage(e, 'Не удалось загрузить сохранённые пароли.'));
        // // При ошибке тоже устанавливаем пустой массив
        // setItems([]);
        
        // При ошибке ставим тестовые пароли
        setItems(TEST_PASSWORDS);
      });
  }, [isAuthenticated, isCheckingSession]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }
    const timerId = window.setTimeout(() => {
      navigate('/passwords', { replace: true, state: null });
    }, 2500);
    return () => window.clearTimeout(timerId);
  }, [flashMessage, navigate]);

  // const filtered = useMemo(() => {
  //   const normalized = query.trim().toLowerCase();
  //   if (!normalized) {
  //     return items;
  //   }
  //   return items.filter((item) => item.description.toLowerCase().includes(normalized));
  // }, [items, query]);
  
const [filters, setFilters] = useState({
  showFavorites: false,
  sortBy: 'date_newest' as 'date_newest' | 'date_oldest' | 'alphabetical',
});

  const filtered = useMemo(() => {
  const normalized = query.trim().toLowerCase();
  let result = [...items]; // создаём копию массива

  // Применяем поиск
  if (normalized) {
    result = result.filter((item) =>
      item.description.toLowerCase().includes(normalized)
    );
  }

  // Применяем сортировку
  switch (filters.sortBy) {
    case 'date_newest':
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'date_oldest':
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
    case 'alphabetical':
      result.sort((a, b) => a.description.localeCompare(b.description));
      break;
  }

  return result;
}, [items, query, filters]);





  const visibleItems = filtered.slice(0, visibleCount);
  console.log(typeof visibleItems);
  const canShowMore = visibleCount < filtered.length;

  const toggleDetails = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <Header />
      <main className="my-passwords-main">
        
          <section className="my-passwords-container">
            {flashMessage && (
              <Alert variant="success" className="auth-success-alert">
                {flashMessage}
              </Alert>
            )}
            <div className="my-passwords-top">
              <h1 className="my-passwords-title mb-0">МОИ ПАРОЛИ</h1>
              <div className="my-passwords-search-wrap d-flex align-items-center">
                <i className="bi bi-search my-passwords-search-icon" aria-hidden role="button" />
                <Form.Control
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="my-passwords-search flex-grow-1"
                  aria-label="Поиск сохранённых паролей"
                />
                <Dropdown className="my-passwords-filter-dropdown">
                  <Dropdown.Toggle
                    as="div"
                    className="bi bi-sliders2 my-passwords-filter-icon"
                    aria-hidden
                    role="button"
                  />
                  <Dropdown.Menu align="end">
                    <Dropdown.Item
                      className='dropdown-filter-item'
                      active={filters.sortBy === 'date_newest'}
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'date_newest' }))}
                    >
                      Сначала новые
                    </Dropdown.Item>
                    <Dropdown.Item
                      className='dropdown-filter-item'
                      active={filters.sortBy === 'date_oldest'}
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'date_oldest' }))}
                    >
                      <span>Сначала старые</span><i className='bi bi-arrow-down' />
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          <ContentBox className='my-passwords-table-layout'>
            <div className="my-passwords-table-box table-responsive">
              {error && <p className="my-passwords-error mb-3">{error}</p>}

              <Table borderless className="my-passwords-table ">
                <thead >
                  <tr className='my-passwords-table-head'>
                    <th>ДАТА</th>
                    <th>ОПИСАНИЕ</th>
                    <th>ПАРОЛЬ</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {isCheckingSession && (
                    <tr>
                      <td colSpan={4} className="my-passwords-empty">
                        Загрузка...
                      </td>
                    </tr>
                  )}
                  {visibleItems.map((item) => {
                    const isExpanded = Boolean(expandedIds[item.id]);
                    return (
                      <tr key={item.id} className='my-passwords-table-content'>
                        <td>{formatDate(item.created_at)}</td>
                        <td className="my-passwords-description-cell">{item.description}</td>
                        <td>{isExpanded ? item.password : maskPassword(item.password)}</td>
                        <td>
                          <button
                            type="button"
                            className="my-passwords-details-btn"
                            onClick={() => navigate('${item.id}/confirm')}
                          >
                            {isExpanded ? 'скрыть' : 'подробнее'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!isCheckingSession && visibleItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="my-passwords-empty">
                        Пока нет сохранённых паролей.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              <div className="my-passwords-bottom">
                <div className='my-passwords-back-link-container'>
                  <Link to="/" className="my-passwords-back-link">
                    {'<< НАЗАД'}
                  </Link>
                </div>
                
                <div className='justify-content-center my-password-more-btn-layout'>
                  <Button
                    type="button"
                    className="my-passwords-more-btn"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    disabled={!canShowMore}
                  >
                    СМОТРЕТЬ ЕЩЕ
                  </Button>
                </div>
              </div>
            </div>
          </ContentBox>  
          </section>
        
      </main>
    </>
  );
}

export default MyPasswords;
