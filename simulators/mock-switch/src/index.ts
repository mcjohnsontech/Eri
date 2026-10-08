import express from 'express';
import cors from 'cors';
import switchRoutes from './routes/switch';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', switchRoutes);

const PORT = 4002;
app.listen(PORT, () => {
  console.log(`Mock Switch running on port ${PORT}`);
});
