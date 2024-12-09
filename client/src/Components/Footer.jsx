import { Container, Row, Col } from "react-bootstrap";
const date = new Date();
const currentYear = date.getFullYear();

const Footer = () => {
  return (
    <footer>
      <Container>
        <Row>
          <Col className="text-center py-3">
            Copyright &copy; {currentYear} ProShop
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
