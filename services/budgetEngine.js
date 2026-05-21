const generateBudget = (income) => {
  return {
    rent: income * 0.30,
    food: income * 0.15,
    savings: income * 0.20,
    transport: income * 0.05,
    free_cash: income * 0.30
  };
};

module.exports = generateBudget;