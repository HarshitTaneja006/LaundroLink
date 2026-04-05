import { storage } from "./storage";
import { matchItemWithImage } from "./gemini";
import type { LostItem, FoundItem } from "@shared/schema";

function log(msg: string) {
  const t = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${t} [matching] ${msg}`);
}

const MATCH_THRESHOLD = 60;

/**
 * When a new found item is reported with an image, run it against all active lost items.
 * Any match >= 60% is saved and the lost item owner gets a notification.
 */
export async function triggerMatchingForFoundItem(foundItem: FoundItem): Promise<void> {
  if (!foundItem.imageUrl) return;

  let lostItems: LostItem[];
  try {
    lostItems = await storage.getAllActiveLostItems();
  } catch (e) {
    log(`Failed to fetch lost items: ${e}`);
    return;
  }

  for (const lostItem of lostItems) {
    try {
      const fullDescription = `${lostItem.color} ${lostItem.clothingType}. ${lostItem.description}`;
      const result = await matchItemWithImage(fullDescription, foundItem.imageUrl);

      log(`lost:${lostItem.id} <-> found:${foundItem.id} = ${result.match_percentage}%`);

      await storage.saveMatch(lostItem.id, foundItem.id, result.match_percentage, result.reasoning);

      if (result.match_percentage >= MATCH_THRESHOLD) {
        await storage.markLostItemMatched(lostItem.id);
        await storage.createNotification(lostItem.userId, {
          title: "Possible match found!",
          message: `A found item matches your lost ${lostItem.color} ${lostItem.clothingType} with ${result.match_percentage}% confidence. Check Found Items to claim it.`,
          type: "match",
        });
      }
    } catch (e) {
      log(`Error matching lost:${lostItem.id} <-> found:${foundItem.id}: ${e}`);
    }
  }
}

/**
 * When a student reports a new lost item, run it against all unclaimed found items with images.
 * Any match >= 60% is saved and the student gets a notification.
 */
export async function triggerMatchingForLostItem(lostItem: LostItem): Promise<void> {
  let foundItems: FoundItem[];
  try {
    foundItems = await storage.getAllFoundItemsWithImages();
  } catch (e) {
    log(`Failed to fetch found items: ${e}`);
    return;
  }

  let bestMatch = 0;

  for (const foundItem of foundItems) {
    if (!foundItem.imageUrl) continue;
    try {
      const fullDescription = `${lostItem.color} ${lostItem.clothingType}. ${lostItem.description}`;
      const result = await matchItemWithImage(fullDescription, foundItem.imageUrl);

      log(`lost:${lostItem.id} <-> found:${foundItem.id} = ${result.match_percentage}%`);

      await storage.saveMatch(lostItem.id, foundItem.id, result.match_percentage, result.reasoning);

      if (result.match_percentage >= MATCH_THRESHOLD && result.match_percentage > bestMatch) {
        bestMatch = result.match_percentage;
      }
    } catch (e) {
      log(`Error matching lost:${lostItem.id} <-> found:${foundItem.id}: ${e}`);
    }
  }

  if (bestMatch >= MATCH_THRESHOLD) {
    await storage.markLostItemMatched(lostItem.id);
    await storage.createNotification(lostItem.userId, {
      title: "Possible match found!",
      message: `We found a possible match for your lost ${lostItem.color} ${lostItem.clothingType} with ${bestMatch}% confidence. Check Found Items to claim it.`,
      type: "match",
    });
  }
}
