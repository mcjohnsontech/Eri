export const customerTexts = [
  "I wish to bring to your attention that a transfer of ₦75,000 to my associate was debited but not received.",
  "Please I sent 50k to my brother but he said nothing came",
  "Abeg help me, I transfer money yesterday e no reach the person",
  "Please reverse immediately and credit me double for the inconvenience",
  "My account was debited for a failed POS transaction",
  "I made a transfer to First Bank, they haven't gotten it since morning.",
  "Why is my money hanging? Return my 20k right now.",
  "The ATM did not dispense cash but I was debited 10,000 naira.",
  "Good day, please look into this transaction, the beneficiary claims they haven't received it.",
  "I tried sending money for hospital bill, it failed but my money is gone! Please help!"
];

export function getRandomText(): string {
  return customerTexts[Math.floor(Math.random() * customerTexts.length)];
}
