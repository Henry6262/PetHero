import SteamUser from 'steam-user';
import SteamTotp from 'steam-totp';
import SteamCommunity from 'steamcommunity';
import TradeOfferManager from 'steam-tradeoffer-manager';

export interface SteamServiceConfig {
  username: string;
  password?: string;
  sharedSecret?: string;
  identitySecret?: string;
  apiKey?: string;
}

export class SteamService {
  private client: any;
  private community: any;
  private manager: any;
  private config: SteamServiceConfig;

  constructor(config: SteamServiceConfig) {
    this.config = config;
    this.client = new SteamUser();
    this.community = new SteamCommunity();
    this.manager = new TradeOfferManager({
      steam: this.client,
      community: this.community,
      language: 'en'
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.client.on('loggedOn', () => {
      console.log('[steam] Logged into Steam network');
      this.client.setPersona(SteamUser.EPersonaState.Online);
    });

    this.client.on('webSession', (sessionID: string, cookies: string[]) => {
      console.log('[steam] Web session created');
      this.manager.setCookies(cookies, (err: Error | null) => {
        if (err) {
          console.error('[steam] Error setting manager cookies:', err);
          return;
        }
        console.log('[steam] Trade manager ready');
      });
      
      this.community.setCookies(cookies);
      
      if (this.config.identitySecret) {
        // Poll for mobile confirmations every 30 seconds
        this.community.startConfirmationChecker(30000, this.config.identitySecret);
        console.log('[steam] Mobile confirmation checker started');
      }
    });

    this.manager.on('newOffer', (offer: any) => {
      console.log(`[steam] New trade offer #${offer.id} from ${offer.partner.getSteamID64()}`);
      
      // Auto-accept logic: 
      // 1. If it's a gift (we give nothing), accept it.
      // 2. In Phase 4, we will eventually cross-reference this with Skinport orders.
      if (offer.itemsToGive.length === 0) {
        console.log(`[steam] Offer #${offer.id} is a gift. Accepting...`);
        offer.accept((err: Error | null) => {
          if (err) console.error(`[steam] Failed to accept offer #${offer.id}:`, err.message);
          else console.log(`[steam] Offer #${offer.id} accepted successfully`);
        });
      } else {
        // If we are giving items (e.g. for a sale or deposit), 
        // we might still want to auto-accept if it matches an expected trade.
        // For now, let's just log it.
        console.log(`[steam] Offer #${offer.id} requires giving items. Manual/Specific logic required.`);
      }
    });

    this.client.on('error', (err: any) => {
      console.error('[steam] Client error:', err.message);
    });
  }

  public start() {
    if (!this.config.username || !this.config.password) {
      console.error('[steam] Missing credentials. Cannot start Steam service.');
      return;
    }

    const logOnOptions: any = {
      accountName: this.config.username,
      password: this.config.password,
    };

    if (this.config.sharedSecret) {
      logOnOptions.twoFactorCode = SteamTotp.generateAuthCode(this.config.sharedSecret);
    }

    console.log(`[steam] Logging in as ${this.config.username}...`);
    this.client.logOn(logOnOptions);
  }

  public stop() {
    this.client.logOff();
    if (this.config.identitySecret) {
      this.community.stopConfirmationChecker();
    }
    console.log('[steam] Service stopped');
  }
}
