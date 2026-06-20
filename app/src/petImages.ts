import type { ImageSourcePropType } from "react-native";
import type { Pet } from "./types";

// Local bundled pet avatars, keyed by pet id. Drop a square-ish photo in
// assets/pets/<id>.png and add the require() here to give a pet its picture.
const PET_IMAGES: Record<string, ImageSourcePropType> = {
  mochi: require("../assets/pets/mochi.png"),
  biscuit: require("../assets/pets/biscuit.png"),
  pixel: require("../assets/pets/pixel.png"),
};

export function petImage(pet: Pick<Pet, "id">): ImageSourcePropType | null {
  return PET_IMAGES[pet.id] ?? null;
}
