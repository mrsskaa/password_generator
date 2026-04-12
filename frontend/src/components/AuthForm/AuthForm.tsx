import { Row, Container, Col } from 'react-bootstrap';
import './AuthForm.css'

function AuthForm ({title, description, form}) {
    return (
        <>
            <Container fluid className='min-vh-100 d-flex py-3 justify-content-center align-items-center formPop'>
                <Row className='justify-content-center w-100'>
                    <Col Col xs={11} sm={9} md={7} lg={6} xl={5}>
                        <div className='p-4 border rounded bg-white auth-form-container'>
                            <>
                                <div className='auth-form-head'>
                                    <div className='auth-form-head-title'>{title}</div>
                                    <div className='auth-form-head-descript d-flex justify-content-center'>
                                        <div className='auth-form-head-descript-text'>{description}</div>
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