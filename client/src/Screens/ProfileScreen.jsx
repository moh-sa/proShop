import { useEffect, useState } from "react";
import { Button, Col, Form, Row, Table } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { LinkContainer } from "react-router-bootstrap";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import { fetchUserOrders, updateUserProfile } from "../store";

const ProfileScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stateErrorMessage, setStateErrorMessage] = useState("");

  const dispatch = useDispatch();

  const authState = useSelector((state) => state.auth);
  const ordersState = useSelector((state) => state.orders.orders);
  const isProfileUpdated = useSelector((state) => state.users.update.success);

  useEffect(() => {
    dispatch(fetchUserOrders());
  }, [dispatch]);

  useEffect(() => {
    if (authState.user || isProfileUpdated) {
      setName(authState.user.name);
      setEmail(authState.user.email);
    }
  }, [authState.user, isProfileUpdated]);

  function isPasswordMatch(password, confirmPassword) {
    return password === confirmPassword;
  }

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!isPasswordMatch(password, confirmPassword))
      return setStateErrorMessage("Passwords do not match");

    dispatch(
      updateUserProfile({ id: authState.user._id, name, email, password }),
    );
  };

  return (
    <Row>
      <Col md={3}>
        <h2>User Profile</h2>
        {stateErrorMessage && (
          <Message variant='danger'>{stateErrorMessage}</Message>
        )}
        {authState.error && (
          <Message variant='danger'>{authState.error.message}</Message>
        )}

        {isProfileUpdated && (
          <Message variant='success'>Profile Updated</Message>
        )}

        {authState.leading && <Loader />}

        <Form onSubmit={submitHandler}>
          <Form.Group controlId='name'>
            <Form.Label>Name</Form.Label>
            <Form.Control
              type='text'
              placeholder='Enter Name'
              value={name}
              onChange={(e) => setName(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Form.Group controlId='email'>
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type='email'
              placeholder='Enter email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Form.Group controlId='password'>
            <Form.Label>Password</Form.Label>
            <Form.Control
              type='password'
              placeholder='Enter password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Form.Group controlId='confirmPassword'>
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type='password'
              placeholder='Confirm password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            ></Form.Control>
          </Form.Group>
          <Button type='submit' variant='primary' className='my-3'>
            Update
          </Button>
        </Form>
      </Col>
      <Col md={9}>
        <h2>My Orders</h2>

        {ordersState.loading && <Loader />}

        {ordersState.error && (
          <Message variant='danger'>{ordersState.error.message}</Message>
        )}

        {!ordersState.loading &&
          !ordersState.error &&
          ordersState.data.length > 0 && (
            <Table striped bordered hover responsive className='table-sm'>
              <thead styles={{ textAlign: "center" }}>
                <tr>
                  <th>ID</th>
                  <th>DATE</th>
                  <th>TOTAL</th>
                  <th>PAID</th>
                  <th>DELIVERED</th>
                  <th></th>
                </tr>
              </thead>
              <tbody style={{ verticalAlign: "middle" }}>
                {ordersState.data.map((order) => (
                  <tr key={order._id}>
                    <td>{order._id}</td>
                    <td>{order.createdAt.substring(0, 10)}</td>
                    <td>{order.totalPrice}</td>
                    <td>
                      {order.isPaid && order.paidAt.substring(0, 10)}
                      {!order.isPaid && (
                        <i
                          className='fas fa-times'
                          style={{ color: "red" }}
                        ></i>
                      )}
                    </td>
                    <td>
                      {order.isDelivered && order.deliveredAt.substring(0, 10)}
                      {!order.isDelivered && (
                        <i
                          className='fas fa-times'
                          style={{ color: "red" }}
                        ></i>
                      )}
                    </td>
                    <td>
                      <LinkContainer to={`/order/${order._id}`}>
                        <Button variant='light' className='btn-sm'>
                          Details
                        </Button>
                      </LinkContainer>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
      </Col>
    </Row>
  );
};

export default ProfileScreen;
