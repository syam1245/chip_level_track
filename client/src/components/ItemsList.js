

import React, { useEffect, useState } from 'react';

const ItemsList = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/items')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Items</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Job Number</th>
            <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Customer Name</th>
            <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Brand</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{item.jobNumber}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{item.customerName}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '8px' }}>{item.brand}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ItemsList;
