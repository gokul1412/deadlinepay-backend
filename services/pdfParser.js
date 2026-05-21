const fs = require("fs");
const pdfParse = require("pdf-parse"); // ✅ rename variable

const parsePDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);

  const data = await pdfParse(dataBuffer); // ✅ use correct function

  const text = data.text;

  const lines = text.split("\n");

  const transactions = [];

  for (let line of lines) {
    const match = line.match(
      /(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+(-?\d+\.\d{2})/
    );

    if (match) {
      transactions.push({
        date: match[1],
        description: match[2],
        amount: parseFloat(match[3]),
      });
    }
  }

  return transactions;
};

module.exports = parsePDF;