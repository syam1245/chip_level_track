

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

  const downloadBackup = () => {
    window.open(`${API_BASE_URL}/api/items/backup`, "_blank");
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h2 style={{ margin: 0 }}>Items</h2>
        <button
          onClick={downloadBackup}
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            padding: "10px 15px",
            fontSize: "14px",
            cursor: "pointer",
            borderRadius: "4px",
            fontWeight: "bold",
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>⬇</span> Download Backup
        </button>
      </div>

      <div style={{ overflowX: 'auto', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', backgroundColor: '#fff' }}>
          <thead style={{ backgroundColor: '#f5f5f5' }}>
            <tr>
              <th style={{ borderBottom: '2px solid #ddd', padding: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>Job Number</th>
              <th style={{ borderBottom: '2px solid #ddd', padding: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>Customer Name</th>
              <th style={{ borderBottom: '2px solid #ddd', padding: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>Brand</th>
              <th style={{ borderBottom: '2px solid #ddd', padding: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>Phone Number</th>
              <th style={{ borderBottom: '2px solid #ddd', padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} style={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                <td style={{ borderBottom: '1px solid #eee', padding: '12px' }}>{item.jobNumber}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '12px' }}>{item.customerName}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '12px' }}>{item.brand}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '12px' }}>{item.phoneNumber}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => deleteItem(item._id)}
                    style={{
                      backgroundColor: "#ff4d4d",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      cursor: "pointer",
                      borderRadius: "4px",
                      fontSize: '13px'
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
    </div>
  );
};

export default ItemsList;
