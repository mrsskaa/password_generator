import { Navbar, Container, Nav, Dropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import './Header.css'
import logo from '../../assets/images/password-generator-logo.svg';
import type { AppDispatch, RootState } from '../../store/store';
import { logout } from '../../store/authSlice';
import { logoutRequest } from '../../api/authApi';
import { clearGeneratorHistory } from '../../utils/generatorHistory';

const Header = () => {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const userId = useSelector((s: RootState) => s.auth.user?.id);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const isPasswordsPage = location.pathname.startsWith('/passwords');

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // сеть/сервер: всё равно чистим локальное состояние
    } finally {
      if (userId != null) {
        clearGeneratorHistory(userId);
      }
      dispatch(logout());
      navigate('/');
    }
  };

  return (
    <Navbar expand="md" className="header-navbar">
  <Container className="header-container">
    <Navbar.Brand className="header-brand" as={Link} to="/">
      <img src={logo} height="40" className="logo" alt="Логотип" />
    </Navbar.Brand>

    {!isAuthenticated && <Navbar.Toggle aria-controls="auth-navbar" />}

    {isAuthenticated && (
      <div className="d-block d-sm-none ms-auto header-actions-desktop">
      <div className="header-auth-icons">
        <Dropdown align="end">
          <Dropdown.Toggle as="button" className="header-icon-btn" id="header-menu-desktop">
            <i className="bi bi-list" aria-hidden />
          </Dropdown.Toggle>
          <Dropdown.Menu className="header-auth-menu">
            <Dropdown.Item as={Link} to="/" className={`header-auth-menu-item ${!isPasswordsPage ? 'is-active' : ''}`}>
              генератор
            </Dropdown.Item>
            <Dropdown.Item as={Link} to="/passwords" className={`header-auth-menu-item ${isPasswordsPage ? 'is-active' : ''}`}>
              мои пароли
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <button type="button" className="header-icon-btn" onClick={handleLogout} aria-label="Выйти">
          <i className="bi bi-arrow-right" aria-hidden />
        </button>
      </div>
    </div>
    )}
    
<Navbar.Collapse id="auth-navbar" className="justify-content-end d-md-flex">
  {!isAuthenticated ? (
    <>
    <div className="d-flex flex-column w-100 text-center d-md-none gap-2">
      <Nav.Link as={Link} to="/register" className='header-text-link'>
        РЕГИСТРАЦИЯ
      </Nav.Link>
       <Link to="/login" className="btn btn-sm btn-md-lg header-btn" role="button">
          ВХОД
        </Link>
    </div>
    
    <div className="d-none d-md-flex ms-auto header-actions-desktop">
      <Nav.Link as={Link} to="/register" className='header-text-link'>
        РЕГИСТРАЦИЯ
      </Nav.Link>
      <Link to="/login" className="btn btn-sm btn-md-lg header-btn" role="button">
          ВХОД
        </Link>
    </div>
    </>
  ) : (
    <>
    <div className="ms-auto header-actions-desktop">
      <div className="header-auth-icons">
        <Dropdown>
          <Dropdown.Toggle as="button" className="header-icon-btn" id="header-menu-desktop">
            <i className="bi bi-list" aria-hidden />
          </Dropdown.Toggle>
          <Dropdown.Menu className="header-auth-menu">
            <Dropdown.Item as={Link} to="/" className={`header-auth-menu-item ${!isPasswordsPage ? 'is-active' : ''}`}>
              генератор
            </Dropdown.Item>
            <Dropdown.Item as={Link} to="/passwords" className={`header-auth-menu-item ${isPasswordsPage ? 'is-active' : ''}`}>
              мои пароли
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <button type="button" className="header-icon-btn" onClick={handleLogout} aria-label="Выйти">
          <i className="bi bi-arrow-right" aria-hidden />
        </button>
      </div>
    </div>
    </>
  )}
</Navbar.Collapse>
  </Container>
</Navbar>
  );
};

export default Header;
