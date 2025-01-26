import { useEffect, useState } from "react";
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
  createSearchParams,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import Rating from "../Components/Rating";
import {
  createProductReview,
  fetchProductDetails,
  resetReviewsState,
} from "../store";

const ProductScreen = () => {
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(1);
  const [comment, setComment] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: productId } = useParams();

  const userState = useSelector((state) => state.auth.user);
  const productState = useSelector((state) => state.products.product);
  const reviewsState = useSelector((state) => state.products.reviews);

  const addToCartHandler = async () => {
    navigate({
      pathname: `/cart/${productId}`,
      search: createSearchParams({ qty }).toString(),
    });
  };

  const createReviewHandler = (e) => {
    e.preventDefault();
    dispatch(
      createProductReview({
        productId,
        review: { rating, comment },
      }),
    );
  };

  useEffect(() => {
    if (reviewsState.success) navigate(0);
  }, [navigate, reviewsState.success]);

  useEffect(() => {
    dispatch(resetReviewsState());
    dispatch(fetchProductDetails({ productId }));
  }, [dispatch, productId]);

  return (
    <>
      <Link className='btn btn-light my-3' to='/'>
        Go Back
      </Link>

      {productState.loading && <Loader />}

      {productState.error && (
        <Message variant='danger'>{productState.error.message}</Message>
      )}

      {productState.data && productState.data.name && (
        <>
          <Row>
            <Col md={6}>
              <Image
                src={productState.data.image}
                alt={productState.data.name}
                fluid
              />
            </Col>
            <Col md={3}>
              <ListGroup variant='flush'>
                <ListGroup.Item>
                  <h2>{productState.data.name}</h2>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Rating
                    value={productState.data.rating}
                    text={` ${productState.data.numReviews} reviews`}
                  />
                </ListGroup.Item>
                <ListGroup.Item>
                  Price: ${productState.data.price}
                </ListGroup.Item>
                <ListGroup.Item>
                  Description: {productState.data.description}
                </ListGroup.Item>
              </ListGroup>
            </Col>
            <Col md={3}>
              <Card>
                <ListGroup variant='flush'>
                  <ListGroup.Item>
                    <Row>
                      <Col>Price:</Col>
                      <Col>
                        <strong>{productState.data.price}</strong>
                      </Col>
                    </Row>
                  </ListGroup.Item>

                  <ListGroup.Item>
                    <Row>
                      <Col>Status:</Col>
                      <Col
                        style={{
                          color:
                            productState.data.countInStock > 0
                              ? "green"
                              : "red",
                        }}
                      >
                        {productState.data.countInStock > 0
                          ? "In Stock"
                          : "Out of Stock"}
                      </Col>
                    </Row>
                  </ListGroup.Item>

                  {productState.data.countInStock > 0 && (
                    <ListGroup.Item>
                      <Row>
                        <Col>Quantity</Col>
                        <Form.Control
                          as='select'
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                        >
                          {[
                            ...Array(productState.data.countInStock).keys(),
                          ].map((x) => (
                            <option key={x + 1} value={x + 1}>
                              {x + 1}
                            </option>
                          ))}
                        </Form.Control>
                      </Row>
                    </ListGroup.Item>
                  )}

                  <ListGroup.Item>
                    <Button
                      type='button'
                      style={{ width: "100%" }}
                      disabled={productState.data.countInStock === 0}
                      onClick={addToCartHandler}
                    >
                      Add to cart
                    </Button>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <h2>Reviews</h2>
              {productState.data.reviews.length === 0 && (
                <Message>No Reviews</Message>
              )}
              <ListGroup variant='flush'>
                {productState.data.reviews.map((review) => (
                  <ListGroup.Item key={review._id}>
                    <strong>{review.name}</strong>
                    <Rating value={review.rating} />
                    <p>{review.createdAt.substring(0, 10)}</p>
                    <p>{review.comment}</p>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item>
                  <h2>Write a Review</h2>
                  {reviewsState.error && (
                    <Message variant='danger'>
                      {reviewsState.error.message}
                    </Message>
                  )}
                  {!userState && (
                    <Message>
                      Please <Link to={"/login"}>sign in</Link> to write a
                      review
                    </Message>
                  )}
                  {userState && (
                    <Form onSubmit={createReviewHandler}>
                      <Form.Group controlId='rating'>
                        <Form.Label>Rating</Form.Label>
                        <Form.Control
                          as='select'
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                        >
                          <optgroup label='Select...' />
                          <option value='1'>1 - Poor</option>
                          <option value='2'>2 - Fair</option>
                          <option value='3'>3 - Good</option>
                          <option value='4'>4 - Very Good</option>
                          <option value='5'>5 - Excellent</option>
                        </Form.Control>
                      </Form.Group>
                      <Form.Group controlId='comment'>
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as='textarea'
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        ></Form.Control>
                      </Form.Group>
                      <Button type='submit' variant='primary'>
                        Submit
                      </Button>
                    </Form>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default ProductScreen;
