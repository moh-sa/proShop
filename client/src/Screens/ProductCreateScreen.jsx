import { useEffect, useRef } from "react";
import { Button, Form } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import FormContainer from "../Components/FormContainer";
import { createProduct } from "../store";

// FIXME: This file is a placeholder.
export default function ProductCreateScreen() {
  const formRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading: isLoading, success: isSuccess } = useSelector(
    (state) => state.products.create,
  );

  async function onSubmit(event) {
    event.preventDefault();

    if (!formRef.current) return;

    const formData = new FormData(formRef.current);

    const formImage = formData.get("image");
    const isImageEmpty = formImage.name.length === 0 || formImage.size === 0;
    if (isImageEmpty) return;

    dispatch(createProduct({ data: formData }));
  }

  useEffect(() => {
    if (isSuccess) navigate("/admin/productList");
  });

  return (
    <>
      <Link to='/admin/productList' className='btn btn-light my-3'>
        Go back
      </Link>
      <FormContainer>
        <h1>Create Product</h1>
        <Form ref={formRef} onSubmit={onSubmit}>
          <Form.Group controlId='name'>
            <Form.Label>Name</Form.Label>
            <Form.Control type='text' name='name' placeholder='Enter Name' />
          </Form.Group>
          <Form.Group controlId='description' className='my-3'>
            <Form.Label>Description</Form.Label>
            <Form.Control
              type='text'
              name='description'
              placeholder='Enter Description'
            />
          </Form.Group>

          <Form.Group controlId='brand' className='my-3'>
            <Form.Label>Brand</Form.Label>
            <Form.Control type='text' name='brand' placeholder='Enter Brand' />
          </Form.Group>

          <Form.Group controlId='category' className='my-3'>
            <Form.Label>Category</Form.Label>
            <Form.Control
              type='text'
              name='category'
              placeholder='Enter Category'
            />
          </Form.Group>

          <Form.Group controlId='countInStock' className='my-3'>
            <Form.Label>Count In Stock</Form.Label>
            <Form.Control
              type='number'
              name='countInStock'
              placeholder='Enter Count in Stock'
            />
          </Form.Group>

          <Form.Group controlId='price' className='my-3'>
            <Form.Label>Price</Form.Label>
            <Form.Control
              type='number'
              name='price'
              placeholder='Enter price'
            />
          </Form.Group>

          <Form.Group controlId='image' className='my-3'>
            <Form.Label className='mt-3'>Upload Image</Form.Label>
            <Form.Control
              type='file'
              name='image'
              accept='image/*'
            ></Form.Control>
          </Form.Group>

          <Button type='submit' disabled={isLoading} onClick={onSubmit}>
            {isLoading ? "Creating..." : "Create Product"}
          </Button>
        </Form>
      </FormContainer>
    </>
  );
}
