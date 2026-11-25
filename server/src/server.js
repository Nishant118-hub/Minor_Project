import app from './app.js';
import { connectDatabase } from './config/db.js';
import { activateDueCampaigns } from './services/campaignActivationService.js';

const port = Number(process.env.PORT || 5000);
const campaignScheduleIntervalMs = 15 * 1000;

async function startServer() {
  try {
    await connectDatabase();
    activateDueCampaigns().catch((error) => {
      console.error('Unable to activate scheduled simulations:', error.message);
    });
    setInterval(() => {
      activateDueCampaigns().catch((error) => {
        console.error('Unable to activate scheduled simulations:', error.message);
      });
    }, campaignScheduleIntervalMs);
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  }
}

startServer();
