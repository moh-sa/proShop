import { useEffect } from "react";
import { Carousel, Image } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { fetchTopRatedProducts } from "../store";
import Loader from "./Loader";
import Message from "./Message";

const ProductCarousel = () => {
  const dispatch = useDispatch();
  const topRatedState = useSelector((state) => state.products.topRated);

  useEffect(() => {
    dispatch(fetchTopRatedProducts());
  }, []);

  if (topRatedState.loading) return <Loader />;

  if (topRatedState.error)
    return <Message variant='danger'>{topRatedState.error.message}</Message>;

  if (topRatedState.data && topRatedState.data.length > 0) {
    return (
      <Carousel pause='hover' className='bg-dark'>
        {topRatedState.data.map((product) => (
          <Carousel.Item key={product._id}>
            <Link to={`/product/${product._id}`}>
              <Image src={product.image} alt={product.name} fluid />
              <Carousel.Caption className='carousel-caption'>
                <h2>
                  {product.name} (${product.price})
                </h2>
              </Carousel.Caption>
            </Link>
          </Carousel.Item>
        ))}
      </Carousel>
    );
  }
};

export default ProductCarousel;
