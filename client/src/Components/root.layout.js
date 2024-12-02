import { Container } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";

export default function RootRouteLayout() {
  return (
    <>
      <Header />
      <main className='py-3'>
        <Container>
          <Outlet /> {/* Routes are rendered here */}
        </Container>
      </main>
      <Footer />
    </>
  );
}
