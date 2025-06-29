const fs = require("fs");
const FormData = require("form-data");
const fetch = require("node-fetch");

async function testUpload() {
  try {
    const form = new FormData();
    form.append("csvFile", fs.createReadStream("sample-data.csv"));

    const response = await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      body: form,
    });

    const result = await response.json();
    console.log("Upload result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Upload error:", error);
  }
}

testUpload();
