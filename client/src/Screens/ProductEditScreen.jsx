import { useEffect, useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormContainer from "../Components/FormContainer";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import {
  fetchProductDetails,
  resetUpdateProductsState,
  updateProduct,
} from "../store";

const ProductEditScreen = () => {
  const formRef = useRef(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState("");

  const { id: productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const productState = useSelector((state) => state.products.product);
  const updateState = useSelector((state) => state.products.update);

  useEffect(() => {
    if (updateState.success) {
      dispatch(resetUpdateProductsState());
      navigate("/admin/productList");
    }
  }, [dispatch, navigate, updateState.success]);

  useEffect(() => {
    if (!productState.data && productId)
      dispatch(fetchProductDetails({ productId }));
  }, [dispatch, productState.data, productId]);

  useEffect(() => {
    if (productState.data) {
      setName(productState.data.name);
      setPrice(productState.data.price);
      setBrand(productState.data.brand);
      setCategory(productState.data.category);
      setCountInStock(productState.data.countInStock);
      setDescription(productState.data.description);
    }
  }, [productState.data, productId]);

  const submitHandler = (e) => {
    e.preventDefault();

    if (!formRef.current) return;

    const formData = new FormData(formRef.current);

    const formImage = formData.get("image");
    const isImageEmpty = formImage.name.length === 0 || formImage.size === 0;
    if (isImageEmpty) formData.delete("image");

    dispatch(
      updateProduct({
        productId: productState.data._id,
        data: formData,
      }),
    );
  };

  return (
    <>
      <Link to='/admin/productList' className='btn btn-light my-3'>
        Go back
      </Link>
      <FormContainer>
        <h1>Edit Product</h1>

        {updateState.loading && <Loader />}
        {updateState.error && (
          <Message variant='danger'>{updateState.error.message}</Message>
        )}

        {productState.loading && <Loader />}

        {productState.error && (
          <Message variant='danger'>{productState.error.message}</Message>
        )}

        {!productState.loading && !productState.error && productState.data && (
          <Form ref={formRef} onSubmit={submitHandler}>
            <Form.Group controlId='name'>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type='text'
                name='name'
                placeholder='Enter Name'
                value={name}
                onChange={(e) => setName(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId='description' className='my-3'>
              <Form.Label>Description</Form.Label>
              <Form.Control
                type='text'
                name='description'
                placeholder='Enter Description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId='brand' className='my-3'>
              <Form.Label>Brand</Form.Label>
              <Form.Control
                type='text'
                name='brand'
                placeholder='Enter Brand'
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId='category' className='my-3'>
              <Form.Label>Category</Form.Label>
              <Form.Control
                type='text'
                name='category'
                placeholder='Enter Category'
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId='image' className='my-3'>
              <Form.Label className='mt-3'>Upload Image</Form.Label>
              <Form.Control
                type='file'
                name='image'
                accept='image/*'
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId='countInStock' className='my-3'>
              <Form.Label>Count In Stock</Form.Label>
              <Form.Control
                type='number'
                name='countInStock'
                placeholder='Enter Count in Stock'
                value={countInStock}
                onChange={(e) => setCountInStock(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId='price' className='my-3'>
              <Form.Label>Price</Form.Label>
              <Form.Control
                type='number'
                name='price'
                placeholder='Enter price'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Button
              type='submit'
              variant='primary'
              className='my-3'
              onClick={submitHandler}
            >
              Update
            </Button>
          </Form>
        )}
      </FormContainer>
    </>
  );
};

export default ProductEditScreen;
