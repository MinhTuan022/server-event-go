const express = require('express');

const app = express();

const PORT = 3001;

app.get('/auth/test', (_req, res) =>{
   res.send("Hello")
})

app.listen(PORT, (err) => {
   if(err){
      console.log(err);
      return;
   }

   console.log(`Server starting at https://localhost:${PORT}`);
});