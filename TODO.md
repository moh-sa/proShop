# TODO

- [ ] Add 'exp' to CV

## CLIENT

- [ ] 'error' now are an array of objects that has 'path' and 'message'
- [ ] `/admin/orderList` has `Validation failed` error
- [ ] 'jwt token' not sent to the server when the user try to update the profile
      multiple times without refreshing the page

---

---

## SERVER

- [ ] Fix 'paypal'.
- [ ] 'TopRatedProduct' does not get updated when a product is deleted
- [ ] try to move the 'cache' to the 'product' controller
- [ ] use alias paths
- [ ] try to combine some endpoints, e.g. getProductDetails combined with
      getProductReviews in a single endpoint
- [ ] make the 'getOrders' endpoint return array of status (pending, shipped,
      cancelled, ...etc) and the actual orders
- [ ] remove 'sentry' from 'server.ts'
- [ ] remove '/uploads' from 'server.ts'
- [ ] remove the 'userId' field from 'getOrders'
- [ ] create 'getByUserId' in 'order.repository.ts'
- [ ] add pagination to get users/reviews/orders

### ERRORS

- [ ] make 'next' optional (:?) or remove it from the error handler
- [ ] add 'error.message' to the error.message
- [ ] refactor the error handler to send consistent response format (status,
      payload, and error)

### TESTS

- [ ] ask AI what is the difference between
      `mock.method(() => ({lean: async () => X}))` and
      `mock.method(() => ({lean: mock.fn(async () => X)}))`
- [ ] remove '()' from test names
- [ ] ensure that all test names are consistent
- [ ] some repos are using destructuring, some are not. Make them consistent
- [ ] Try to add 'mongoose.Error.ValidationError' to the repos error handlers to
      throw 'validationError' instead of 'DatabaseError'
