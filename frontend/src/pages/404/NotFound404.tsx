import './NotFound404.css';
import Header from '../../components/Header/Header';
import { Container} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import toxis from '../../assets/images/toxis-origin.svg';

function NotFound404(){
      return (
        <>
            <Header />
            <Container fluid className="not-found d-flex py-2 justify-content-center align-items-center">
                <main className='not-found-layout'>
                    <div className='d-flex justify-content-center align-items-center not-found-text'>
                        <span className='not-found-digit'>4</span>
                        <img src={toxis} className='not-found-image'/>
                        <span className='not-found-digit'>4</span>
                    </div>
                    <div className='not-found-context'>
                        <span>Мы сожалеем, но страница, на которую вы пытались перейти, не существует.<br />Пожалуйста, вернитесь на главную страницу</span>
                    </div>
                    <div className="not-found-btn-wrapper">
                        <Link to="/" className='btn btn-sm btn-md-lg not-found-btn' role='button'>
                            ГЛАВНАЯ
                        </Link>
                    </div>
                </main>
            </Container>

        </>

    );
}

export default NotFound404;