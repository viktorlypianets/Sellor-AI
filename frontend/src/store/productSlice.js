import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async () => {
    try {
      console.log("Fetching products data from backend...", backendURL);
      const res = await axios.get(backendURL + "/api/shopify/sync-products");
      let response = res.data;
      if (response.success) {
        return response.data;
      } else {
        return [];
      }
      // console.log(response);
      // return response;
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }
);

const ProductSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearProducts: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { clearProducts } = ProductSlice.actions;

export default ProductSlice.reducer;
