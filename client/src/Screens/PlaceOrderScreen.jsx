import { useEffect } from "react";
import { Button, Card, Col, Image, ListGroup, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import CheckoutSteps from "../Components/CheckoutSteps";
import Message from "../Components/Message";
import { createOrder } from "../store";

const PlaceOrderScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItemsState = useSelector((state) => state.cart.cartItems);
  const shippingAddressState = useSelector(
    (state) => state.cart.shippingAddress,
  );
  const paymentMethodState = useSelector((state) => state.cart.paymentMethod);
  const createState = useSelector((state) => state.orders.create);

  // TODO: refactor to a helper function
  //Calculate prices
  const prices = {
    items: Number(
      cartItemsState
        .reduce((acc, item) => acc + item.price * item.qty, 0)
        .toFixed(2),
    ),
    shipping() {
      return Number(this.items > 100 ? 0 : 100);
    },
    tax() {
      return Number((0.15 * this.items).toFixed(2));
    },
    total() {
      return Number((this.items + this.shipping() + this.tax()).toFixed(2));
    },
  };

  const placeOrderHandler = async () => {
    dispatch(
      createOrder({
        orderItems: cartItemsState,
        shippingAddress: shippingAddressState,
        paymentMethod: paymentMethodState,
        itemsPrice: prices.items,
        shippingPrice: prices.shipping(),
        taxPrice: prices.tax(),
        totalPrice: prices.total(),
      }),
    );
  };

  useEffect(() => {
    if (createState.success) navigate(`/order/${createState.data._id}`);
  }, [navigate, createState.success, createState.order]);

  return (
    <>
      <CheckoutSteps step1 step2 step3 step4 />
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Address: </strong>
                {shippingAddressState.address}, {shippingAddressState.city}{" "}
                {shippingAddressState.postalCode},{" "}
                {shippingAddressState.country}
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Payment Method</h2>
              <p>
                <strong>Method: </strong>
                {paymentMethodState}
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Order Items</h2>
              {cartItemsState.length === 0 && (
                <Message>Your Cart is empty</Message>
              )}
              {cartItemsState.length > 0 && (
                <ListGroup variant='flush'>
                  {cartItemsState.map((item, index) => (
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
                          <Link to={`product/${item.product}`}>
                            {item.name}
                          </Link>
                        </Col>
                        <Col md={4}>
                          {item.qty} x ${item.price} = ${item.qty * item.price}
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
                  <Col>${prices.items}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>${prices.shipping()}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>${prices.tax()}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Total</Col>
                  <Col>${prices.total()}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                {createState.error && (
                  <Message variant='danger'>
                    {createState.error.message}
                  </Message>
                )}
              </ListGroup.Item>

              <ListGroup.Item>
                <Button
                  type='button'
                  className='btn-block'
                  disabled={cartItemsState === 0}
                  onClick={placeOrderHandler}
                >
                  Place Order
                </Button>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PlaceOrderScreen;
