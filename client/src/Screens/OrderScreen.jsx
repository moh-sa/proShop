import { useEffect } from "react";
import { Button, Card, Col, Image, ListGroup, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import {
  deliverOrder,
  fetchOrderDetails,
  resetDeliverState,
  resetPayState,
} from "../store";

const OrderScreen = () => {
  // const [sdkReady, setSdkReady] = useState(false);

  const { id: orderId } = useParams();
  const dispatch = useDispatch();

  const userState = useSelector((state) => state.auth.user);
  const orderState = useSelector((state) => state.orders.order);
  const payState = useSelector((state) => state.orders.pay);
  const deliverState = useSelector((state) => state.orders.deliver);

  // const addPayPalScript = async () => {
  //   const baseUrl =
  //     import.meta.env.DEV === "development"
  //       ? import.meta.env.VITE_BACK_DEV_URL
  //       : import.meta.env.VITE_BACK_URL;

  //   const { data: clientId } = await axios.get(`${baseUrl}/api/config/paypal`);
  //   const script = document.createElement("script");
  //   script.type = "text/javascript";
  //   script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`;
  //   script.async = true;
  //   script.onload = () => setSdkReady(true);
  //   document.body.appendChild(script);
  // };

  // const successPaymentHandler = (paymentResult) => {
  //   dispatch(payOrder(orderId, paymentResult));
  // };

  const deliverHandler = () => {
    dispatch(deliverOrder(orderId));
  };

  useEffect(() => {
    if (!orderState.data && orderId) dispatch(fetchOrderDetails({ orderId }));
  }, [dispatch, orderState.data, orderId]);

  useEffect(() => {
    if (payState.success || deliverState.success) {
      dispatch(resetPayState());
      dispatch(resetDeliverState());
    }
    // else if (!orderTemp.order.isPaid) {
    //   if (!window.paypal) {
    //     addPayPalScript();
    //   } else {
    //     setSdkReady(true);
    //   }
    // }
  }, [dispatch, payState.success, deliverState.success]);

  if (orderState.loading) return <Loader />;

  if (orderState.error)
    return <Message variant='danger'>{orderState.orderError.message}</Message>;

  if (orderState && orderState.data) {
    return (
      <>
        <h1>Order {orderState.data._id}</h1>
        <Row>
          <Col md={8}>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Shipping</h2>
                <p>
                  <strong>Name:</strong> {orderState.data.user.name}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${orderState.data.user.email}`}>
                    {orderState.data.user.email}
                  </a>
                </p>
                <p>
                  <strong>Address: </strong>
                  {orderState.data.shippingAddress.address},{" "}
                  {orderState.data.shippingAddress.city}{" "}
                  {orderState.data.shippingAddress.postalCode},{" "}
                  {orderState.data.shippingAddress.country}
                </p>
                {orderState.data.isDelivered ? (
                  <Message variant='success'>
                    Delivered on {orderState.data.deliveredAt}
                  </Message>
                ) : (
                  <Message variant='danger'>Not Delivered</Message>
                )}
              </ListGroup.Item>

              <ListGroup.Item>
                <h2>Payment Method</h2>
                <p>
                  <strong>Method: </strong>
                  {orderState.data.paymentMethod}
                </p>
                {orderState.data.isPaid ? (
                  <Message variant='success'>
                    Paid on {orderState.data.paidAt}
                  </Message>
                ) : (
                  <Message variant='danger'>Not Paid</Message>
                )}
              </ListGroup.Item>

              <ListGroup.Item>
                <h2>Order Items</h2>
                {orderState.data.orderItems.length === 0 ? (
                  <Message>Order is empty</Message>
                ) : (
                  <ListGroup variant='flush'>
                    {orderState.data.orderItems.map((item, index) => (
                      <ListGroup.Item key={index}>
                        <Row>
                          <Col md={1}>
                            <Image
                              src={item.image}
                              alt={item.name}
                              fluid
                              rounded
                            />
                          </Col>
                          <Col>
                            <Link to={`/product/${item.product}`}>
                              {item.name}
                            </Link>
                          </Col>
                          <Col md={4}>
                            {item.qty} x ${item.price} = $
                            {item.qty * item.price}
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col md={4}>
            <Card>
              <ListGroup variant='flush'>
                <ListGroup.Item>
                  <h2>Order Summary</h2>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Items</Col>
                    <Col>${orderState.data.itemsPrice}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Shipping</Col>
                    <Col>${orderState.data.shippingPrice}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Tax</Col>
                    <Col>${orderState.data.taxPrice}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Total</Col>
                    <Col>${orderState.data.totalPrice}</Col>
                  </Row>
                </ListGroup.Item>

                {!orderState.data.isPaid && (
                  <ListGroup.Item>
                    {payState.loading && <Loader />}
                    {/* // TODO: implement paypal */}
                    <Button disabled>PayPal Placeholder</Button>
                    {/* {!sdkReady ? (
                    <Loader />
                  ) : (
                    
                  )} */}
                  </ListGroup.Item>
                )}

                {deliverState.loading && <Loader />}

                {userState.isAdmin &&
                  orderState.data.isPaid &&
                  !orderState.data.isDelivered && (
                    <ListGroup.Item>
                      <Button
                        type='button'
                        className='btn btn-block'
                        onClick={deliverHandler}
                      >
                        Mark as Delivered
                      </Button>
                    </ListGroup.Item>
                  )}
              </ListGroup>
            </Card>
          </Col>
        </Row>
      </>
    );
  }
};

export default OrderScreen;
