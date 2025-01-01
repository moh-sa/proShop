import { useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import Paginate from "../Components/Paginate";
import Product from "../Components/Product";
import ProductCarousel from "../Components/ProductCarousel";
import { fetchProducts } from "../store";

const HomeScreen = () => {
  const params = useParams();
  const dispatch = useDispatch();

  const keyword = params.keyword;
  const pageNumber = params.pageNumber || 1;

  const productsState = useSelector((state) => state.products.products);

  useEffect(() => {
    dispatch(fetchProducts({ keyword, pageNumber }));
  }, [dispatch, keyword, pageNumber]);

  return (
    <>
      {!keyword && <ProductCarousel />}
      <h1>Latest Products</h1>
      {productsState.loading && <Loader />}
      {productsState.error && (
        <Message variant='danger'>{productsState.error.message}</Message>
      )}
      {productsState.data && productsState.data.products.length > 0 && (
        <>
          <Row>
            {productsState.data.products.map((product) => (
              <Col key={product._id} sm={12} md={6} lg={4}>
                <Product product={product} />
              </Col>
            ))}
          </Row>
          <Paginate
            page={productsState.data.page}
            pages={productsState.data.pages}
            keyword={keyword ? keyword : ""}
          />
        </>
      )}
    </>
  );
};

export default HomeScreen;
