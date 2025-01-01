import { useEffect } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  ListGroup,
  Row,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import Message from "../Components/Message";
import { getProductByIdAPI } from "../services/api";
import { addItem, removeItem } from "../store";

const CartScreen = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id: productId } = useParams();

  const cartItemsState = useSelector((state) => state.cart.cartItems);

  const qty = searchParams.get("qty") ?? 1;

  async function getCartItemDetails(productId) {
    const { data } = await getProductByIdAPI(productId);
    return data;
  }

  function createCartItemObject(product, quantity) {
    return {
      ...product,
      product: product._id, // TODO: the database requires a '_id' and 'product' fields. Remove the 'product' field from the schema.
      qty: quantity,
    };
  }

  // TODO: add validation for quantity
  function dispatchAddItemToCart(data) {
    dispatch(addItem(data));
  }

  async function addItemToCartHandler(productId, quantity) {
    const data = await getCartItemDetails(productId);
    const newCartItem = createCartItemObject(data, quantity);
    dispatchAddItemToCart(newCartItem);
  }

  const removeFromCartHandler = (productId) => {
    dispatch(removeItem(productId));
  };

  const checkoutHandler = () => {
    navigate("/login?redirect=shipping");
  };

  useEffect(() => {
    if (productId) {
      addItemToCartHandler(productId, Number(qty));
    }
  }, [productId, qty]);

  return (
    <Row>
      <Col md={8}>
        <h1>Shopping Cart</h1>
        {cartItemsState.length === 0 && (
          <Message>
            Your cart is empty. <Link to='/'>Go Back</Link>
          </Message>
        )}

        {cartItemsState && cartItemsState.length > 0 && (
          <ListGroup variant='flush'>
            {cartItemsState.map((item) => (
              <ListGroup.Item key={item._id}>
                <Row>
                  <Col md={2}>
                    <Image src={item.image} alt={item.name} fluid rounded />
                  </Col>
                  <Col md={3}>
                    <Link to={`/product/${item._id}`}>{item.name}</Link>
                  </Col>
                  <Col md={2}>${item.price}</Col>
                  <Col md={2}>
                    <Form.Control
                      as='select'
                      value={item.qty}
                      onChange={(e) =>
                        addItemToCartHandler(item._id, Number(e.target.value))
                      }
                    >
                      {[...Array(item.countInStock).keys()].map((x) => (
                        <option key={x + 1} value={x + 1}>
                          {x + 1}
                        </option>
                      ))}
                    </Form.Control>
                  </Col>
                  <Col md={2}>
                    <Button
                      type='button'
                      variant='light'
                      onClick={() => removeFromCartHandler(item._id)}
                    >
                      <i className='fas fa-trash'></i>
                    </Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Col>
      <Col md={4}>
        <Card>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>
                Subtotal (
                {cartItemsState.reduce((acc, item) => acc + item.qty, 0)}) items
              </h2>
              $
              {cartItemsState
                .reduce((acc, item) => acc + item.qty * item.price, 0)
                .toFixed(2)}
            </ListGroup.Item>
            <ListGroup.Item>
              <Button
                type='button'
                className='btn-block'
                disabled={cartItemsState.length === 0}
                onClick={checkoutHandler}
              >
                Proceed to Checkout
              </Button>
            </ListGroup.Item>
          </ListGroup>
        </Card>
      </Col>
    </Row>
  );
};

export default CartScreen;
