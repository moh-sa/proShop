import { useEffect } from "react";
import { Button, Table } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { LinkContainer } from "react-router-bootstrap";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import { deleteUser, fetchUsers } from "../store";

const UsersListScreen = () => {
  const dispatch = useDispatch();

  const usersState = useSelector((state) => state.users.users);
  const removeState = useSelector((state) => state.users.delete);

  const deleteHandler = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      dispatch(deleteUser(id));
    }
  };

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch, removeState.success]);

  return (
    <>
      <h1>Users</h1>
      {usersState.loading && <Loader />}

      {usersState.error && (
        <Message variant='danger'>{usersState.error.message}</Message>
      )}

      {!usersState.loading &&
        !usersState.error &&
        usersState.data.length > 0 && (
          <Table striped bordered hover responsive className='table-sm'>
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ADMIN</th>
                <th>OPTIONS</th>
              </tr>
            </thead>
            <tbody>
              {usersState.data.map((user) => (
                <tr key={user._id}>
                  <td>{user._id}</td>

                  <td>{user.name}</td>

                  <td>
                    <a href={`mailto:${user.email}`}>{user.email}</a>
                  </td>

                  <td style={{ textAlign: "center" }}>
                    {user.isAdmin ? (
                      <i
                        className='fas fa-check'
                        style={{ color: "green" }}
                      ></i>
                    ) : (
                      <i className='fas fa-times' style={{ color: "red" }}></i>
                    )}
                  </td>

                  <td style={{ textAlign: "center" }}>
                    <LinkContainer to={`/admin/user/${user._id}/edit`}>
                      <Button variant='light' className='btn-sm'>
                        <i className='fas fa-edit'></i>
                      </Button>
                    </LinkContainer>
                    <Button
                      variant='danger'
                      className='btn-sm'
                      onClick={() => deleteHandler(user._id, user.name)}
                    >
                      <i className='fas fa-trash'></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
    </>
  );
};

export default UsersListScreen;
