import { Row, Container, Nav, Col } from 'react-bootstrap';
import './AuthForm.css'
import { Link} from 'react-router-dom';

function AuthForm ({title, linkTo, linkText, form}) {
    return (
        <>
            <Container fluid className='min-vh-100 d-flex py-3 justify-content-center align-items-center formPop'>
                <Row className='justify-content-center w-100'>
                    <Col Col xs={11} sm={9} md={7} lg={6} xl={5}>
                        <div className='p-4 border rounded shadow bg-white'>
                            <>
                                <h2 className="text-center formName">{title}</h2>
                                <div className='formClue d-flex justify-content-center'>
                                    <div className='formClueText d-flex align-items-center gap-2'>
                                        <span>Уже есть аккаунт?</span>
                                        <Nav.Link as={Link} to={linkTo} className='p-0 m-0'>{linkText}</Nav.Link>
                                    </div>
                                </div>
                                {form}
                            </>
                        </div>  
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default AuthForm;