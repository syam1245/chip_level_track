
import React from 'react'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const Input = () => {
  return (
    <div>
      <TextField id="outlined-basic" label="Job Number" variant="outlined" />
      <TextField id="outlined-basic" label="Customer Name" variant="outlined" />
      <TextField id="outlined-basic" label="Brand" variant="outlined" />
      <Button variant="contained">CREATE</Button>
    </div>
  )
}

export default Input
