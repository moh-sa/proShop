import { useState } from "react";
import { Button, Col, Form } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CheckoutSteps from "../Components/CheckoutSteps";
import FormContainer from "../Components/FormContainer";
import { setPaymentMethod as savePaymentMethod } from "../store";

const PaymentScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("PayPal");
  const shippingAddressState = useSelector(
    (state) => state.cart.shippingAddress,
  );
  if (!shippingAddressState) {
    return navigate({
      pathname: "/shipping",
    });
  }

  const submitHandler = async (e) => {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    navigate({
      pathname: "/placeorder",
    });
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 step3 />
      <h1>Payment Method</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group>
          <Form.Label as='legend'>Select Method</Form.Label>
          <Col>
            <Form.Check
              type='radio'
              label='PayPal or Credit Card'
              id='paypasl'
              name='paymentMethod'
              value='PayPal'
              checked
              onChange={(e) => setPaymentMethod(e.target.value)}
            ></Form.Check>
            <Form.Check
              type='radio'
              label='Stripe'
              id='stripe'
              name='paymentMethod'
              value='Stripe'
              onChange={(e) => setPaymentMethod(e.target.value)}
            ></Form.Check>
          </Col>
        </Form.Group>
        <Button type='submit' variant='primary' className='my-3'>
          Continue
        </Button>
      </Form>
    </FormContainer>
  );
};

export default PaymentScreen;
