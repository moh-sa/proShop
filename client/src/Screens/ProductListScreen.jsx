import { useEffect } from "react";
import { Button, Col, Row, Table } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../Components/Loader";
import Message from "../Components/Message";
import Paginate from "../Components/Paginate";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  resetCreateProductState,
  resetDeleteProductState,
} from "../store";

const ProductListScreen = () => {
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const pageNumber = params.pageNumber || 1;

  const productsState = useSelector((state) => state.products.products);
  const createState = useSelector((state) => state.products.create);
  const removeState = useSelector((state) => state.products.delete);

  const deleteHandler = (productId, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      dispatch(deleteProduct({ productId }));
    }
  };

  useEffect(() => {
    if (removeState.success) {
      dispatch(resetDeleteProductState());
      setTimeout(() => navigate(0), 250); // refresh the page
    }
  }, [removeState.success]);

  async function createProductHandler() {
    // for some reason, I don't see a "createProductScreen" component
    // and the backend only creates a sample product!
    // TODO: fix this
    const data = {
      name: "Sample Name",
      image: "/images/sample.png",
      brand: "sample brand",
      category: "sample category",
      description: "sample description",
      reviews: [],
    };
    dispatch(createProduct({ data }));
  }

  useEffect(() => {
    if (createState.success) {
      dispatch(resetCreateProductState());
    }
  }, [createState.success]);

  useEffect(() => {
    dispatch(fetchProducts({ keyword: "", pageNumber }));
  }, [dispatch, pageNumber]);

  return (
    <>
      <Row className='align-items-center'>
        <Col>
          <h1>Products</h1>
        </Col>
        <Col style={{ textAlign: "right" }}>
          <Button className='my-3' onClick={createProductHandler}>
            <i className='fas fa-plus'></i> Create Product
          </Button>
        </Col>
      </Row>

      {removeState.loading && <Loader />}
      {removeState.error && (
        <Message variant='danger'>{removeState.error.message}</Message>
      )}

      {createState.loading && <Loader />}
      {createState.error && (
        <Message variant='danger'>{createState.error.message}</Message>
      )}

      {productsState.loading && <Loader />}
      {productsState.error && (
        <Message variant='danger'>{productsState.error.message}</Message>
      )}
      {productsState.data && productsState.data.products.length > 0 && (
        <>
          <Table striped bordered hover responsive className='table-sm'>
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>PRICE</th>
                <th>CATEGORY</th>
                <th>BRAND</th>
              </tr>
            </thead>
            <tbody>
              {productsState.data.products.map((product) => (
                <tr key={product._id}>
                  <td>{product._id}</td>

                  <td>{product.name}</td>

                  <td>${product.price}</td>

                  <td>{product.category}</td>

                  <td>{product.brand}</td>

                  <td style={{ textAlign: "center" }}>
                    <LinkContainer to={`/admin/product/${product._id}/edit`}>
                      <Button variant='light' className='btn-sm'>
                        <i className='fas fa-edit'></i>
                      </Button>
                    </LinkContainer>
                    <Button
                      variant='danger'
                      className='btn-sm'
                      onClick={() => deleteHandler(product._id, product.name)}
                    >
                      <i className='fas fa-trash'></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Paginate
            page={productsState.data.page}
            pages={productsState.data.pages}
            isAdmin={true}
          />
        </>
      )}
    </>
  );
};

export default ProductListScreen;
