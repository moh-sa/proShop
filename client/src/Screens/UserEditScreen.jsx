import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormContainer from "../Components/FormContainer";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import { fetchUserDetails, resetUpdateUsersState, updateUser } from "../store";

const UserEditScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: userId } = useParams();

  const userState = useSelector((state) => state.users.user);
  const updateState = useSelector((state) => state.users.update);

  useEffect(() => {
    if (updateState.success) {
      dispatch(resetUpdateUsersState());
      navigate({
        pathname: "/admin/userlist",
      });
    }
  }, [dispatch, navigate, updateState.success]);

  useEffect(() => {
    if (
      !userState.data ||
      !userState.data.name ||
      userState.data._id !== userId
    ) {
      dispatch(fetchUserDetails({ userId }));
    }
  }, [dispatch, userState.data, userId]);

  useEffect(() => {
    if (
      userState.data &&
      userState.data.name &&
      userState.data._id === userId
    ) {
      setName(userState.data.name);
      setEmail(userState.data.email);
      setIsAdmin(userState.data.isAdmin);
    }
  }, [userState.data, userId]);

  const submitHandler = async (e) => {
    e.preventDefault();
    dispatch(updateUser({ _id: userId, name, email, isAdmin }));
  };

  return (
    <>
      <Link to='/admin/userlist' className='btn btn-light my-3'>
        Go back
      </Link>
      <FormContainer>
        <h1>Edit User</h1>
        {updateState.loading && <Loader />}
        {updateState.error && (
          <Message variant='danger'>{updateState.error.message}</Message>
        )}
        {userState.loading && <Loader />}
        {userState.error && (
          <Message variant='danger'>{userState.error.message}</Message>
        )}
        {name && (
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

            <Form.Group controlId='email' className='my-3'>
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type='email'
                placeholder='Enter email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId='isadmin'>
              <Form.Check
                type='checkbox'
                label='Is Admin'
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              ></Form.Check>
            </Form.Group>

            <Button type='submit' variant='primary' className='my-3'>
              Update
            </Button>
          </Form>
        )}
      </FormContainer>
    </>
  );
};

export default UserEditScreen;
