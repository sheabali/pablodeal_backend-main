import { setupEmailWorker } from "@/services/email/email.jobs";
import { setupLeagueWorker } from "@/features/league/league.jobs";

setupEmailWorker();
setupLeagueWorker();
