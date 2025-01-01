import { useEffect } from "react";
import { Button, Table } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { LinkContainer } from "react-router-bootstrap";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import { fetchAdminOrders } from "../store";

const OrderListScreen = () => {
  const dispatch = useDispatch();
  const ordersState = useSelector((state) => state.orders.orders);

  // TODO: implement delete order

  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  return (
    <>
      <h1>Orders</h1>
      {ordersState.loading && <Loader />}

      {ordersState.error && (
        <Message variant='danger'>{ordersState.error.message}</Message>
      )}

      {!ordersState.loading &&
        !ordersState.error &&
        ordersState.data.length > 0 && (
          <Table striped bordered hover responsive className='table-sm'>
            <thead>
              <tr>
                <th>ID</th>
                <th>USER</th>
                <th>DATE</th>
                <th>TOTAL</th>
                <th>PAID</th>
                <th>DELIVERED</th>
              </tr>
            </thead>
            <tbody>
              {ordersState.data.map((order) => (
                <tr key={order._id}>
                  <td>{order._id}</td>

                  <td>{order.user && order.user.name}</td>

                  <td>{order.createdAt.substring(0, 10)}</td>

                  <td>${order.totalPrice}</td>

                  <td style={{ textAlign: "center" }}>
                    {order.isPaid ? (
                      order.paidAt.substring(0, 10)
                    ) : (
                      <i className='fas fa-times' style={{ color: "red" }}></i>
                    )}
                  </td>

                  <td style={{ textAlign: "center" }}>
                    {order.isDelivered ? (
                      order.deliveredAt.substring(0, 10)
                    ) : (
                      <i className='fas fa-times' style={{ color: "red" }}></i>
                    )}
                  </td>

                  <td style={{ textAlign: "center" }}>
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
    </>
  );
};

export default OrderListScreen;
