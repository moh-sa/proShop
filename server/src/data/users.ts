import bcrypt from "bcryptjs";

const users = [
  {
    email: "admin@example.com",
    isAdmin: true,
    name: "Admin User",
    password: bcrypt.hashSync("123456", 10),
  },
  {
    email: "john@example.com",
    name: "John Doe",
    password: bcrypt.hashSync("123456", 10),
  },
  {
    email: "jane@example.com",
    name: "Jane Doe",
    password: bcrypt.hashSync("123456", 10),
  },
];

export default users;
