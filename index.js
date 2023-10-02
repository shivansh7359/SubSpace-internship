const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

const blog = require("./routes/blogRoute");
app.use("/api", blog);


app.get("/", (req,res) => {
    res.send("Api is running");    
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started at port ${PORT} `);
});
