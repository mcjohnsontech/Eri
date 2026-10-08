import express from 'express';
import cors from 'cors';
import settlementRoutes from './routes/settlement';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', settlementRoutes);

const PORT = 4003;
app.listen(PORT, () => {
  console.log(`Mock Settlement running on port ${PORT}`);
});
