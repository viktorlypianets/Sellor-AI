import { configureStore } from "@reduxjs/toolkit";
import faqReducer from "./faqSlice";
import productReducer from "./productSlice";

export const store = configureStore({
  reducer: {
    faqs: faqReducer,
    products: productReducer,
  },
});
