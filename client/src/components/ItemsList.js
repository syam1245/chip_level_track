

import React, { useEffect, useState } from 'react';

import API_BASE_URL from "../api";




const ItemsList = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = () => {
    fetch(`${API_BASE_URL}/api/items`)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error(err));
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems(items.filter((item) => item._id !== id));
      } else {
        console.error("Failed to delete item");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Items</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Job Number</th>
            <th style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Customer Name</th>
            <th style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Brand</th>
            <th style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Phone Number</th>
            <th style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{item.jobNumber}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{item.customerName}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{item.brand}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{item.phoneNumber}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px', textAlign: 'center' }}>
                <button
                  onClick={() => deleteItem(item._id)}
                  style={{
                    backgroundColor: "#ff4d4d",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ItemsList;
