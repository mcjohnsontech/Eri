import express from 'express';
import cors from 'cors';
import ledgerRoutes from './routes/ledger';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', ledgerRoutes);

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Mock Ledger running on port ${PORT}`);
});
