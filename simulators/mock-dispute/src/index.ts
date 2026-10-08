import express from 'express';
import cors from 'cors';
import disputeRoutes from './routes/dispute';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', disputeRoutes);

const PORT = 4004;
app.listen(PORT, () => {
  console.log(`Mock Dispute running on port ${PORT}`);
});
