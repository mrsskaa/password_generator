import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import './Header.css'
import logo from '../../assets/images/password-generator-logo.svg';
import type { AppDispatch, RootState } from '../../store/store';
import { logout } from '../../store/authSlice';
import { logoutRequest } from '../../api/authApi';

const Header = () => {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // сеть/сервер: всё равно чистим локальное состояние
    } finally {
      dispatch(logout());
    }
  };

  return (
    <Navbar expand="md" className="header-navbar">
  <Container className="header-container">
    <Navbar.Brand className="header-brand" as={Link} to="/">
      <img src={logo} height="40" className="logo" alt="Логотип" />
    </Navbar.Brand>

    <Navbar.Toggle aria-controls="auth-navbar" />
    
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
    <div className="d-flex flex-column w-100 text-center d-md-none gap-2">
      <button type="button" className="btn btn-sm btn-md-lg header-btn" onClick={handleLogout}>
        ВЫХОД
      </button>
    </div>
    <div className="d-none d-md-flex ms-auto header-actions-desktop">
      <button type="button" className="btn btn-sm btn-md-lg header-btn" onClick={handleLogout}>
        ВЫХОД
      </button>
    </div>
    </>
  )}
</Navbar.Collapse>
  </Container>
</Navbar>
  );
};

export default Header;
