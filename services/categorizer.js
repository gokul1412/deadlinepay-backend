const rules = {
  swiggy: 1,      // Food
  zomato: 1,
  uber: 2,        // Transport
  ola: 2,
  amazon: 3,      // Shopping
  flipkart: 3,
  netflix: 4      // Subscription
};

const categorize = (desc) => {
  const text = desc.toLowerCase();

  for (let key in rules) {
    if (text.includes(key)) {
      return rules[key];
    }
  }

  return null;
};

module.exports = categorize;