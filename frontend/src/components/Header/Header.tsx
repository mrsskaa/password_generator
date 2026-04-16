import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Header.css'
import logo from '../../assets/images/password-generator-logo.svg';

const Header = () => {
  return (
    <Navbar expand="md" className="header-navbar">
  <Container className="header-container">
    <Navbar.Brand className="header-brand">
      <img src={logo} height="40" className="logo" alt="Логотип" />
    </Navbar.Brand>

    <Navbar.Toggle aria-controls="auth-navbar" />
    
<Navbar.Collapse id="auth-navbar" className="justify-content-end d-md-flex">
  {/* {isAuthPage && ( */}
    <>
    <div className="d-flex flex-column w-100 text-center d-md-none gap-2">  {/* Мобильное */}
      <Nav.Link as={Link} to="/register" className='header-text-link'>
        РЕГИСТРАЦИЯ
      </Nav.Link>
       <Button 
        role="link" 
        href='/login' 
        variant="default" 
        className='btn-sm btn-md-lg header-btn'>
          ВХОД
        </Button>
    </div>
    
    <div className="d-none d-md-flex ms-auto header-actions-desktop">
      <Nav.Link as={Link} to="/register" className='header-text-link'>
        РЕГИСТРАЦИЯ
      </Nav.Link>
      <Button 
        role="link" 
        href='/login' 
        variant="default" 
        className='btn-sm btn-md-lg header-btn'>
          ВХОД
        </Button>
    </div>
    </>
  {/* } )} */}
</Navbar.Collapse>
  </Container>
</Navbar>
  );
};

export default Header;