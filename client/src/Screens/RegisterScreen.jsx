import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FormContainer from "../Components/FormContainer";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import { register } from "../store";

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useSelector((state) => state.auth);

  const redirect = searchParams.get("redirect") ?? "/";

  useEffect(() => {
    if (auth.user) {
      navigate({
        pathname: `/${redirect}`,
      });
    }
  }, [navigate, auth.user, redirect]);

  function isPasswordMatch(password, confirmPassword) {
    return password === confirmPassword;
  }

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!isPasswordMatch(password, confirmPassword))
      return setMessage("Passwords do not match");

    dispatch(register({ name, email, password }));
  };

  return (
    <FormContainer>
      <h1>Sign Up</h1>
      {message && <Message variant='danger'>{message}</Message>}
      {auth.error && <Message variant='danger'>{auth.error.message}</Message>}
      {auth.loading && <Loader />}
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
          Register
        </Button>
      </Form>
      <Row>
        <Col>
          Have an Account?{" "}
          <Link to={redirect ? `/login?redirect=${redirect}` : `/login`}>
            Login
          </Link>
        </Col>
      </Row>
    </FormContainer>
  );
};

export default RegisterScreen;
