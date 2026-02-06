

import React, { useEffect, useState } from 'react';

import API_BASE_URL from "../api";




const ItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchItems();

    // Track window resize for responsive layout
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchItems = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/items`)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const deleteItem = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this item?\n\nClick OK to confirm deletion or Cancel to abort.");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems(items.filter((item) => item._id !== id));
        alert("✅ Deleted from database successfully!");
      } else {
        console.error("Failed to delete item");
        alert("❌ Failed to delete from database. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error deleting from database. Please check your connection.");
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

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          fontSize: '16px',
          color: '#666'
        }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          Loading items...
        </div>
      ) : items.length === 0 ? (
        // Empty Database State
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #eee'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '1rem'
          }}>📭</div>
          <h3 style={{
            color: '#333',
            marginBottom: '0.5rem',
            fontSize: '20px'
          }}>Database is Empty</h3>
          <p style={{
            color: '#666',
            fontSize: '14px',
            marginBottom: '1.5rem'
          }}>No records found. Start by adding a new entry.</p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              backgroundColor: '#3498db',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            + Add New Entry
          </a>
        </div>
      ) : isMobile ? (
        // Mobile Card Layout
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => (
            <div
              key={item._id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #eee'
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Job Number</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{item.jobNumber}</div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Customer Name</div>
                <div style={{ fontSize: '15px', color: '#333' }}>{item.customerName}</div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Brand</div>
                <div style={{ fontSize: '15px', color: '#333' }}>{item.brand}</div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Phone Number</div>
                <div style={{ fontSize: '15px', color: '#333' }}>{item.phoneNumber}</div>
              </div>

              <button
                onClick={() => deleteItem(item._id)}
                style={{
                  backgroundColor: "#ff4d4d",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  cursor: "pointer",
                  borderRadius: "6px",
                  fontSize: '14px',
                  fontWeight: '500',
                  width: '100%'
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        // Desktop Table Layout
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
      )}
    </div>
  );
};

export default ItemsList;
