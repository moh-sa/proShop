<br/>
<p align="center">
  <h3 align="center">ProShop</h3>
  <p align="center">
    A MERN eCommerce project based on Brad Traversy's course.
  </p>
</p>

## Demo
  **URL**: https://proshop.moh-sa.dev
  
  
## Built With

**Client**: ReactJS, Axios, bootstrap, react-router, redux, and PayPal SDK.

**Server**: ExpressJs, Mongoose, JWT, morgan, Multer, express-async-handler, cors, bcrypt, and dontenv.

## Order Creation and Payment Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend
    participant Backend as Backend
    participant Order_Manager as Order Manager
    participant Order_Service as Order Service
    participant Payment_Service as Payment Service
    participant Stripe_API as Stripe API

    User->>Frontend: Clicks "Checkout"
    Frontend->>Backend: Send checkout request
    Backend->>Order_Manager: Create order and payment session
    Order_Manager->>Order_Service: Create order (status: pending)
    Order_Service-->>Order_Manager: Order created (order ID)
    Order_Manager->>Payment_Service: Create Stripe session (order ID, amount)
    Payment_Service->>Stripe_API: Create checkout session
    Stripe_API-->>Payment_Service: Checkout session URL
    Payment_Service-->>Order_Manager: Stripe session URL
    Order_Manager-->>Backend: Stripe session URL
    Backend-->>Frontend: Stripe session URL
    Frontend->>User: Redirect to Stripe checkout
    Frontend->>Stripe_API: Load Stripe checkout

    alt Payment successful
        Stripe_API->>Backend: POST /api/v1/webhooks/stripe (payment successful)
        Backend->>Order_Manager: Update order status to "paid"
        Order_Manager->>Order_Service: Set status to "paid"
        Order_Service-->>Order_Manager: Order updated
        Order_Manager-->>Backend: Order status updated
        Backend-->>Frontend: Notify payment success
        Frontend->>User: Show order confirmation
    else Payment failed
        Stripe_API->>Backend: POST /api/v1/webhooks/stripe (payment failed)
        Backend->>Order_Manager: Update order status to "canceled"
        Order_Manager->>Order_Service: Set status to "canceled"
        Order_Service-->>Order_Manager: Order updated
        Order_Manager-->>Backend: Order status updated
        Backend-->>Frontend: Notify payment failure
        Frontend->>User: Show payment failed page
    end
```
