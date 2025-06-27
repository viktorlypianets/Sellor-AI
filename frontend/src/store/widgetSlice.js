import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export const updateWidgets = createAsyncThunk(
  "/widgets/update",
  async (data) => {
    console.log("Updating widgets data...", data);
    try {
      const res = await axios.post(backendURL + `/api/admin/widget`, {
        ...data,
      });
      let response = res.data;
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Approval failed");
      }
    } catch (error) {
      throw error;
    }
  }
);

const faqSlice = createSlice({
  name: "widgets",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateWidgets.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateWidgets.fulfilled, (state, action) => {
        state.status = "successed";
        state.items = action.payload;
      })
      .addCase(updateWidgets.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { approveFaq, editFaq } = faqSlice.actions;
export default faqSlice.reducer;
