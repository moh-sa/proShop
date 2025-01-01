import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { LinkContainer } from "react-router-bootstrap";
import { authLogout } from "../store/auth/auth.slice";
import SearchBar from "./SearchBar";

function Header() {
  const dispatch = useDispatch();
  const userState = useSelector((state) => state.auth.user);

  const logoutHandler = async () => {
    dispatch(authLogout());
  };
  return (
    <>
      <div
        style={{
          backgroundColor: "darkgrey",
          color: "white",
          textAlign: "center",
        }}
      >
        ⚠This app is from{" "}
        <a href='https://www.udemy.com/course/mern-ecommerce'>Brad Traversy</a>
        's course.⚠ Check the{" "}
        <a href='https://github.com/moh-sa/proShop'>
          <i className='fa-brands fa-github'></i> github repo
        </a>
        .
      </div>
      <header>
        <Navbar bg='dark' variant='dark' expand='lg' collapseOnSelect>
          <Container>
            <LinkContainer to='/'>
              <Navbar.Brand href='/'>ProShop</Navbar.Brand>
            </LinkContainer>

            <Navbar.Toggle aria-controls='basic-navbar-nav' />
            <Navbar.Collapse id='basic-navbar-nav'>
              <SearchBar />
              <Nav style={{ marginLeft: "auto" }}>
                <LinkContainer to='/cart'>
                  <Nav.Link>
                    <i className='fas fa-shopping-cart'></i> Cart
                  </Nav.Link>
                </LinkContainer>

                {userState ? (
                  <NavDropdown title={userState.name} id='username'>
                    <LinkContainer to='/profile'>
                      <NavDropdown.Item>Profile</NavDropdown.Item>
                    </LinkContainer>
                    <NavDropdown.Item onClick={logoutHandler}>
                      Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                ) : (
                  <LinkContainer to='/login'>
                    <Nav.Link>
                      <i className='fas fa-user'></i> Sign In
                    </Nav.Link>
                  </LinkContainer>
                )}
                {userState && userState.isAdmin && (
                  <NavDropdown title='Admin' id='adminmenu'>
                    <LinkContainer to='/admin/userlist'>
                      <NavDropdown.Item>Users</NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to='/admin/productList'>
                      <NavDropdown.Item>Products</NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to='/admin/orderList'>
                      <NavDropdown.Item>Orders</NavDropdown.Item>
                    </LinkContainer>
                  </NavDropdown>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>
    </>
  );
}

export default Header;
