import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchProducts } from "../store/productSlice";
import { Bell, Globe, Percent, Search, SlidersHorizontal } from "lucide-react";
import "../style/container.css";

const ReplicabotReviews = () => {
  const statusColor = {
    active: "green",
    "sold out": "red",
    "fast filling": "yellow",
  };

  let navList = [1, 2, 3, 4, 5];

  const [reviewList, setReviewList] = useState([]);
  const [filterList, setFilterList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(1);
  const [showItemList, setShowItemList] = useState([]);
  const [perCount, setPerCount] = useState(5);
  const [searchValue, setSearchValue] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, status, error } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (status === "succeeded") {
      toast.success("Products fetched successfully");
    }
  });

  useEffect(() => {
    if (Array.isArray(items)) {
      if (items.length > 0) {
        console.log(items);
        let newArray = items.filter((item) => {
          return item.title
            .toLowerCase()
            .includes(searchValue.toLowerCase().trim());
        });
        setShowItemList(
          newArray.slice(perCount * (selectedItem - 1), perCount * selectedItem)
        );
      }
    }
  }, [selectedItem, items, searchValue]);

  function HtmlRenderer({ html }) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const changeValue = (e) => {
    setPerCount(e.target.value);
  };

  const changeSearchValue = (e) => {
    setSearchValue(e.target.value);
    if (Array.isArray(filterList)) {
      if (filterList.length !== 0) {
      }
    }
  };

  return (
    <div className="mainContainter">
      {status === "loading" ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="container">
          <header className="reply-header"></header>

          <div className="controls">
            <div
              style={{
                flex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
              }}
            >
              <div className="search-box">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search"
                  onChange={changeSearchValue}
                />
              </div>
              <button className="filter-button">
                <SlidersHorizontal className="filter-icon" /> Filter
              </button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 3,
                justifyContent: "space-evenly",
                gap: "10px",
              }}
            >
              <select className="select-table">
                <option>Columns</option>
              </select>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <p>Show :</p>
                <select
                  className="select-table"
                  onChange={changeValue}
                  style={{ width: "60px" }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="navigation-button">&lt;</button>
                <div className="pagination">
                  {navList.map((n, i) => (
                    <button
                      key={n}
                      className={`page-button ${
                        n === selectedItem ? "active" : ""
                      }`}
                      onClick={() => setSelectedItem(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <button className="navigation-button">&gt;</button>
              </div>
            </div>
          </div>

          <table className="product-table">
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Product Image</th>
                <th style={{ width: "10%" }}>Product Names</th>
                <th style={{ width: "20%" }}>Product Description</th>
              </tr>
            </thead>
            <tbody>
              {showItemList?.map((product, i) => (
                <tr
                  key={i}
                  className={i % 2 === 1 ? "alt-row" : ""}
                  style={{ cursor: "pointer", border: "none" }}
                  onClick={() => {
                    localStorage.setItem("store_id", product.store_id);
                    localStorage.setItem("product_id", product.id);
                    console.log(
                      "shopify_product_id",
                      product.shopify_product_id
                    );
                    navigate(`/customer/${product.shopify_product_id}`);
                  }}
                >
                  <td>
                    <img
                      src={
                        product.image_URL
                          ? product.image_URL
                          : "/images/HairDryer.png"
                      }
                      style={{
                        width: "100px",
                        height: "100px",
                      }}
                      alt={product.title}
                    />
                  </td>
                  <td>
                    <span>{product.title}</span>
                  </td>
                  <td>
                    <HtmlRenderer html={product.description} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReplicabotReviews;
