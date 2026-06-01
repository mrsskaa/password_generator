import { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Form, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../components/Header/Header';
import type { AppDispatch, RootState } from '../../store/store';
import { loginSuccess } from '../../store/authSlice';
import {
  fetchCurrentUser,
  getAxiosErrorMessage,
  getSavedPasswordsRequest,
  type SavedPasswordItem,
} from '../../api/authApi';
import './MyPasswords.css';
import { useFlashToast } from '../../hooks/useFlashToast';
import { formatDateOnly } from '../../utils/formatDateTime';

const PAGE_SIZE = 5;

type SortOrder = 'new' | 'old';

function maskPassword(): string {
  return '••••••••••';
}

function MyPasswords() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  useFlashToast();

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SavedPasswordItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('new');
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
    void getSavedPasswordsRequest({ limit: 100, offset: 0 })
      .then((data) => {
        setItems(data.items);
      })
      .catch((e) => {
        setError(getAxiosErrorMessage(e, 'Не удалось загрузить сохранённые пароли.'));
      });
  }, [isAuthenticated, isCheckingSession]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, sortOrder]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const byQuery = normalized
      ? items.filter((item) => item.description.toLowerCase().includes(normalized))
      : items;

    return [...byQuery].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sortOrder === 'new' ? bTime - aTime : aTime - bTime;
    });
  }, [items, query, sortOrder]);

  const visibleItems = filtered.slice(0, visibleCount);
  const canShowMore = visibleCount < filtered.length;
  const hasNoPasswords = !isCheckingSession && items.length === 0;
  const hasNoMatches = !isCheckingSession && items.length > 0 && filtered.length === 0;
  const isEmptyState = hasNoPasswords || hasNoMatches;
  const showTable = !isCheckingSession && filtered.length > 0;
  const showMoreButton = showTable && items.length > PAGE_SIZE && canShowMore;

  const handleOpenDetails = (item: SavedPasswordItem) => {
    navigate(`/passwords/${item.id}/unlock`, { state: { item } });
  };

  return (
    <>
      <Header />
      <main className={`my-passwords-main${isEmptyState ? ' my-passwords-main--empty' : ''}`}>
        <section className="my-passwords-container">
          <div className="my-passwords-top">
            <h1 className="my-passwords-title mb-0">МОИ ПАРОЛИ</h1>
            <div className="my-passwords-search-wrap">
              <i className="bi bi-search my-passwords-search-icon" aria-hidden />
              <Form.Control
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="my-passwords-search"
                aria-label="Поиск по названию"
              />
              <Dropdown align="end" className="my-passwords-filter-dropdown">
                <Dropdown.Toggle as="button" className="my-passwords-filter-btn" id="my-passwords-sort-dropdown">
                  <i className="bi bi-sliders2 my-passwords-filter-icon" aria-hidden />
                </Dropdown.Toggle>
                <Dropdown.Menu className="my-passwords-filter-menu" renderOnParent>
                  <Dropdown.Item
                    className={`my-passwords-filter-item ${sortOrder === 'new' ? 'is-active' : ''}`}
                    onClick={() => setSortOrder('new')}
                  >
                    сначала новые <i className="bi bi-arrow-up-short" aria-hidden />
                  </Dropdown.Item>
                  <Dropdown.Item
                    className={`my-passwords-filter-item ${sortOrder === 'old' ? 'is-active' : ''}`}
                    onClick={() => setSortOrder('old')}
                  >
                    сначала старые <i className="bi bi-arrow-down-short" aria-hidden />
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          <div className="my-passwords-table-area">
          <div className={`my-passwords-table-box${isEmptyState ? ' is-empty' : ''}`}>
            {error && <p className="my-passwords-error mb-3">{error}</p>}

            {showTable && (
              <Table borderless className="my-passwords-table mb-0">
                <thead>
                  <tr>
                    <th>ДАТА</th>
                    <th>ОПИСАНИЕ</th>
                    <th>ПАРОЛЬ</th>
                    <th />
                  </tr>
                  <tr className="my-passwords-thead-line-row" aria-hidden="true">
                    <td colSpan={4}>
                      <div className="my-passwords-thead-line" />
                    </td>
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
                  {visibleItems.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDateOnly(item.created_at)}</td>
                      <td className="my-passwords-description-cell" title={item.description}>
                        <span className="my-passwords-description-text my-passwords-description-text--desktop">
                          {item.description}
                        </span>
                        <span className="my-passwords-description-text my-passwords-description-text--mobile">
                          {item.description.length > 10 ? `${item.description.slice(0, 10)}…` : item.description}
                        </span>
                      </td>
                      <td>{maskPassword()}</td>
                      <td>
                        <button
                          type="button"
                          className="my-passwords-details-btn"
                          onClick={() => handleOpenDetails(item)}
                        >
                          подробнее
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            {hasNoPasswords && (
              <p className="my-passwords-empty-message mb-0">Сохраненных паролей пока нет...</p>
            )}
            {hasNoMatches && (
              <p className="my-passwords-empty-message mb-0">По вашему запросу пароли не найдены</p>
            )}

            <div className="my-passwords-bottom">
              <Link to="/" className="my-passwords-back-link">
                {'<< назад'}
              </Link>
              {showMoreButton && (
                <Button
                  type="button"
                  className="my-passwords-more-btn"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                >
                  СМОТРЕТЬ ЕЩЕ
                </Button>
              )}
            </div>
          </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default MyPasswords;
