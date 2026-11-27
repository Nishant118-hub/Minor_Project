import app from './app.js';
import { connectDatabase } from './config/db.js';
import { activateDueCampaigns } from './services/campaignActivationService.js';
import { ensureBootstrapAdmin } from './services/bootstrapAdminService.js';

const port = Number(process.env.PORT || 5000);
const campaignScheduleIntervalMs = 15 * 1000;

async function startServer() {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  try {
    await connectDatabase();
    if (process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_PASSWORD) {
      try {
        await ensureBootstrapAdmin();
        console.log('Bootstrap administrator is ready.');
      } catch (error) {
        console.error('Unable to bootstrap administrator:', error.message);
      }
    }

    activateDueCampaigns().catch((error) => {
      console.error('Unable to activate scheduled simulations:', error.message);
    });
    setInterval(() => {
      activateDueCampaigns().catch((error) => {
        console.error('Unable to activate scheduled simulations:', error.message);
      });
    }, campaignScheduleIntervalMs);
  } catch (error) {
    console.error('Database unavailable:', error.message);
    console.error('The API will remain available for health checks, but database-backed endpoints will be unavailable.');
  }
}

startServer();
