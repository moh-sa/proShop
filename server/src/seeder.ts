import connectDB from "./config/db.js";
import products from "./data/products.js";
import users from "./data/users.js";
import Order from "./models/orderModel.js";
import Product from "./models/productModel.js";
import User from "./models/userModel.js";

connectDB();

const importData = async () => {
  try {
    const createdUsers = await User.insertMany(users);
    const adminUser = createdUsers[0]._id;

    const sampleProducts = products.map((p) => {
      return { ...p, user: adminUser };
    });

    await Product.insertMany(sampleProducts);

    console.info("Data Imported!");
    process.exit(); // eslint-disable-line n/no-process-exit
  } catch (error) {
    console.error(error);
    process.exit(1); // eslint-disable-line n/no-process-exit
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    console.info("Data Destroyed!");
    process.exit(); // eslint-disable-line n/no-process-exit
  } catch (error) {
    console.error(error);
    process.exit(1); // eslint-disable-line n/no-process-exit
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
