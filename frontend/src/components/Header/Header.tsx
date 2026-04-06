import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, NavLink, useLocation } from 'react-router-dom';

const Header = () => {
    const location=useLocation();

    const isAuthPage = ['/login', '/register'].includes(location.pathname);


  return (
    <Navbar expand="md" className="shadow-sm">
      <Container>
        {/* Логотип */}
        <Navbar.Brand as={Link} to="/">
          <img
            src="/logo.png"  // путь к вашему логотипу
            height="40"
            className="logo"
            alt="Логотип"
          />
        </Navbar.Brand>

        <div className='d-flex gap-2'>
            {isAuthPage && (
                <>
                <Nav.Link as={Link} to="/register">РЕГИСТРАЦИЯ</Nav.Link>
                <Button as={Link} to="/login" className='btn-sm btn-md-lg'>ВХОД</Button>
                </>
                
            )}
        </div>
      </Container>
    </Navbar>
  );
};

export default Header;