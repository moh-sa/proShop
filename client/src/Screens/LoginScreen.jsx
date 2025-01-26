import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FormContainer from "../Components/FormContainer";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import { login } from "../store";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authState = useSelector((state) => state.auth);

  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  useEffect(() => {
    if (authState.user) {
      navigate({
        pathname: redirect,
      });
    }
  }, [navigate, authState.user, redirect]);

  const submitHandler = async (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <FormContainer>
      <h1>Sign In</h1>
      {authState.error && (
        <Message variant='danger'>{authState.error.message}</Message>
      )}
      {authState.loading && <Loader />}
      <Form onSubmit={submitHandler}>
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
        <Button type='submit' variant='primary' className='my-3'>
          Sign In
        </Button>
      </Form>
      <Row>
        <Col>
          New Customer?{" "}
          <Link to={redirect ? `/register?redirect=${redirect}` : `/register`}>
            Register
          </Link>
        </Col>
      </Row>
    </FormContainer>
  );
};

export default LoginScreen;
