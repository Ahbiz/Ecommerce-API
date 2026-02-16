Integrating Flutterwave into a Node.js/Express app is a great choice for handling payments in Nigeria and beyond. Since you're already using MongoDB (Mongoose), we’ll structure this to ensure your database stays in sync with every transaction.

### The Payment Flow

1. **Initiate:** Your server tells Flutterwave, "I want to collect $X from User Y."
2. **Redirect:** Flutterwave gives you a **Payment Link**. You send this link to your user.
3. **Pay:** The user enters their card/bank details on Flutterwave’s secure page.
4. **Verify:** After payment, Flutterwave sends the user back to your site and sends a **Webhook** to your server to confirm the money was actually received.

---

### 1. Prerequisites & Setup

First, sign up on the [Flutterwave Dashboard](https://www.google.com/search?q=https://dashboard.flutterwave.com/) to get your **API Keys** (Test Mode first!).

**Install Dependencies:**

```bash
npm install flutterwave-node-v3 dotenv mongoose

```

**Environment Variables (.env):**

```env
FLW_PUBLIC_KEY=FLWPUBK_TEST-XXXXX
FLW_SECRET_KEY=FLWSECK_TEST-XXXXX
FLW_ENCRYPTION_KEY=FLWSECK_TEST-XXXXX

```

---

### 2. The Transaction Model (Mongoose)

You need a way to track payments in your database.

```javascript
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transactionId: { type: Number }, // Flutterwave's internal ID
  tx_ref: { type: String, required: true, unique: true }, // Your unique reference
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  status: { type: String, enum: ['pending', 'successful', 'failed'], default: 'pending' },
  email: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);

```

---

### 3. Step 1: Initialize Payment

When the user clicks "Pay Now," your backend generates a payment link.

```javascript
const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
const Transaction = require('./models/Transaction');

const payService = async (req, res) => {
  try {
    const { amount, email, name, userId } = req.body;
    const tx_ref = `tx-${Date.now()}`; // Unique reference for this transaction

    // 1. Create a pending record in your DB
    await Transaction.create({ tx_ref, amount, email, userId });

    // 2. Prepare Flutterwave payload
    const payload = {
      tx_ref,
      amount,
      currency: "NGN",
      redirect_url: "https://your-frontend.com/payment-status", 
      customer: { email, name },
      customizations: {
        title: "My Service Payment",
        description: "Payment for subscription"
      }
    };

    // 3. Generate Payment Link
    const response = await flw.Standard.charge(payload);
    res.json(response); // Send this link to your frontend to redirect the user
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

```

---

### 4. Step 2: Verify Payment (The Webhook)

**Never** trust the frontend to tell you a payment was successful. Always use a **Webhook** or call the Flutterwave verify endpoint.

**Why?** Because a user could close their browser before being redirected back to your site. A Webhook ensures your database is updated even if the user disappears.

```javascript
const verifyPayment = async (req, res) => {
  // Flutterwave sends the transaction ID in the query params or webhook body
  const { transaction_id, status, tx_ref } = req.query;

  if (status === 'successful') {
    const response = await flw.Transaction.verify({ id: transaction_id });

    if (
      response.data.status === "successful" &&
      response.data.amount === expectedAmountFromDB && // IMPORTANT: Verify amount!
      response.data.currency === "NGN"
    ) {
      // Update your DB
      await Transaction.findOneAndUpdate({ tx_ref }, { status: 'successful', transactionId: transaction_id });
      // Give value to the customer here
      return res.redirect('https://your-frontend.com/success');
    }
  }
  
  res.redirect('https://your-frontend.com/failed');
};

```

---

### Key Security Tips

* **Secret Hash:** In your Flutterwave Dashboard settings, set a **Secret Hash**. When Flutterwave sends a webhook, check the `verif-hash` header to ensure it's actually from them.
* **Verify Amount:** Always compare the amount returned by Flutterwave with the amount in your database. A common hack is for users to intercept the request and change the price to ₦1.
* **Unique References:** Always generate a unique `tx_ref` for every attempt. Using timestamps or UUIDs is standard practice.
