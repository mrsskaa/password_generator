import { Button, Container, Form, Nav } from "react-bootstrap";
import Header from "../../components/Header/Header";
import './CodeFormConfirm.css';
import ContentBox from "../../components/ContentBox/ContentBox";
import { Link, useNavigate, useParams } from "react-router-dom";

function CodeWordConfirm(){
    const navigate=useNavigate();
    const params = useParams();
    const password_id = params.id;
    return(
        <>
            <Header />
            <Container className="auth-form-viewport d-flex py-2 justify-content-center align-items-center">
                <ContentBox className="justify-content-center ">
                    <div className="code-word-confirm-container">
                        <h2 className="code-word-confirm-title">ВВЕДИТЕ КОДОВОЕ СЛОВО</h2>
                        <Form className="code-word-confirm-form" onSubmit={() => navigate('/passwords/${password_id}/details')}>
                            
                            <Form.Control
                                type="text"
                                required
                                className="code-word-confirm-form-input"
                                />
                            <div className="code-word-confirm-form-bottom">
                                <div className="code-word-confirm-form-bottom-back-link-container">
                                    <Nav.Link as={Link} to="passwords" className="code-word-confirm-form-bottom-back-link">
                                        {'<< назад'}
                                    </Nav.Link>
                                    </div>
                                    <div className="justify-content-center code-word-confirm-form-submit-button-container">
                                    <Button variant="default" type="submit" className="justify-content-center code-word-confirm-form-submit-button">
                                        ВОЙТИ
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </div>
                </ContentBox>
            </Container>
        </>
    );
}

export default CodeWordConfirm;