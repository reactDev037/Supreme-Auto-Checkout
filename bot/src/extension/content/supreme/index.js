import SupremeManager from './SupremeManager';
import { notify } from './notification';

export default class SupremeExtension {
  start(profile) {
    if (!profile || !profile.Supreme) {
      notify('Open the extension to configure the bot', true);
      return;
    }
    const settings = profile.Supreme;
    const manager = new SupremeManager(settings.Options, settings.Sizes, settings.Billing);
    manager.start();
  }
}
