import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Switch, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerSheet } from "./DrawerSheet";
import { useTheme } from "../ThemeContext";
import { api } from "../api";
import { radius, shadow, space } from "../theme";
import type { FoodOption, Medication, Pet } from "../types";

interface PetSettingsDrawerProps {
  pet: Pet | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (pet: Pet) => void;
}

export function PetSettingsDrawer({ pet, visible, onClose, onSaved }: PetSettingsDrawerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);

  const [automation, setAutomation] = useState(false);
  const [color, setColor] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [waterMl, setWaterMl] = useState("");
  const [foodGrams, setFoodGrams] = useState("");
  const [foods, setFoods] = useState<FoodOption[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pet) return;
    setAutomation(pet.automation_enabled ?? false);
    setColor(pet.color ?? "");
    setWeightKg(pet.weight_kg?.toString() ?? "");
    setWaterMl(pet.daily_water_ml?.toString() ?? "");
    setFoodGrams(pet.daily_food_grams?.toString() ?? "");
    setFoods(pet.food_options?.length ? [...pet.food_options] : [{ id: "default", name: "Dry food", portion_grams: 45, min_interval_hours: 5, is_default: true }]);
    setMeds(pet.medications?.length ? [...pet.medications] : []);
    setError(null);
  }, [pet]);

  if (!pet) return null;

  const addFood = () => {
    setFoods((prev) => [
      ...prev.map((f, i) => ({ ...f, is_default: i === 0 && prev.length === 0 })),
      {
        id: `food_${Date.now()}`,
        name: "",
        portion_grams: 45,
        min_interval_hours: 5,
        is_default: prev.length === 0,
      },
    ]);
  };

  const updateFood = (index: number, patch: Partial<FoodOption>) => {
    setFoods((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeFood = (index: number) => {
    setFoods((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 1) next[0].is_default = true;
      return next;
    });
  };

  const addMed = () => {
    setMeds((prev) => [
      ...prev,
      {
        id: `med_${Date.now()}`,
        name: "",
        dose_count: 1,
        interval_hours: 12,
        notes: "",
        active: true,
      },
    ]);
  };

  const updateMed = (index: number, patch: Partial<Medication>) => {
    setMeds((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const removeMed = (index: number) => {
    setMeds((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    setLoading(true);
    setError(null);
    try {
      const payloadFoods = foods.map((f, i) => ({ ...f, is_default: i === 0 }));
      const updated = await api.updatePetSettings(pet.id, {
        automation_enabled: automation,
        food_options: payloadFoods,
        medications: meds,
        color: color.trim() || pet.color,
        weight_kg: parseFloat(weightKg) || pet.weight_kg,
        daily_water_ml: parseFloat(waterMl) || pet.daily_water_ml,
        daily_food_grams: parseFloat(foodGrams) || pet.daily_food_grams,
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerSheet visible={visible} onClose={onClose} title={`${pet.name}'s care plan`} kicker="PET SETTINGS">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.xl }}>
        {/* Automation toggle */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.rowBetween}>
            <View style={styles.rowIcon}>
              <View style={[styles.iconCircle, { backgroundColor: colors.greenSoft }]}>
                <Ionicons name="sync-circle" size={20} color={colors.green} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Automate care</Text>
                <Text style={styles.cardSubtitle}>Feed and give meds on schedule</Text>
              </View>
            </View>
            <Switch
              value={automation}
              onValueChange={setAutomation}
              trackColor={{ false: colors.border, true: colors.green }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Robot tag + Metrics */}
        <Text style={styles.sectionTitle}>Robot tag</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={styles.inputLabel}>Color label used in robot commands</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. red, white, orange"
            placeholderTextColor={colors.muted}
            value={color}
            onChangeText={setColor}
          />
          <Text style={styles.hintText}>Example command: “{color || "white"} {pet.species}, feed 1 {foods[0]?.name || "food"}”</Text>
        </View>

        <Text style={styles.sectionTitle}>Real metrics</Text>
        <View style={styles.metricsRow}>
          <MetricInput label="Weight" value={weightKg} onChange={setWeightKg} unit="kg" colors={colors} />
          <MetricInput label="Water" value={waterMl} onChange={setWaterMl} unit="ml / day" colors={colors} />
          <MetricInput label="Food" value={foodGrams} onChange={setFoodGrams} unit="g / day" colors={colors} />
        </View>

        {/* Food */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Food</Text>
          <Pressable onPress={addFood} style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}>
            <Ionicons name="add" size={18} color={colors.text} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
        {foods.map((food, i) => (
          <View key={food.id} style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{food.is_default ? "Default food" : `Food option ${i + 1}`}</Text>
              {foods.length > 1 && (
                <Pressable onPress={() => removeFood(i)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.red} />
                </Pressable>
              )}
            </View>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Name (e.g. Dry food)"
              placeholderTextColor={colors.muted}
              value={food.name}
              onChangeText={(t) => updateFood(i, { name: t })}
            />
            <View style={styles.inputRow}>
              <NumberInput
                label="Portion (g)"
                value={food.portion_grams.toString()}
                onChange={(t) => updateFood(i, { portion_grams: parseFloat(t) || 0 })}
                colors={colors}
              />
              <NumberInput
                label="Interval (h)"
                value={food.min_interval_hours.toString()}
                onChange={(t) => updateFood(i, { min_interval_hours: parseFloat(t) || 0 })}
                colors={colors}
              />
            </View>
          </View>
        ))}

        {/* Medication */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medication</Text>
          <Pressable onPress={addMed} style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}>
            <Ionicons name="add" size={18} color={colors.text} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
        {meds.length === 0 && <Text style={styles.emptyText}>No medications configured.</Text>}
        {meds.map((med, i) => (
          <View key={med.id} style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <View style={styles.rowIcon}>
                <Switch
                  value={med.active}
                  onValueChange={(v) => updateMed(i, { active: v })}
                  trackColor={{ false: colors.border, true: colors.amber }}
                  thumbColor="#fff"
                  style={{ marginRight: space.sm }}
                />
                <Text style={styles.cardTitle}>{med.active ? "Active" : "Paused"}</Text>
              </View>
              <Pressable onPress={() => removeMed(i)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.red} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Medicine name (e.g. thyroid)"
              placeholderTextColor={colors.muted}
              value={med.name}
              onChangeText={(t) => updateMed(i, { name: t })}
            />
            <View style={styles.inputRow}>
              <NumberInput
                label="Dose count"
                value={med.dose_count.toString()}
                onChange={(t) => updateMed(i, { dose_count: parseInt(t, 10) || 0 })}
                colors={colors}
              />
              <NumberInput
                label="Interval (h)"
                value={med.interval_hours.toString()}
                onChange={(t) => updateMed(i, { interval_hours: parseFloat(t) || 0 })}
                colors={colors}
              />
            </View>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Notes"
              placeholderTextColor={colors.muted}
              value={med.notes}
              onChangeText={(t) => updateMed(i, { notes: t })}
            />
          </View>
        ))}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable onPress={save} disabled={loading} style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save care plan</Text>}
        </Pressable>
      </ScrollView>
    </DrawerSheet>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const styles = useThemedStyles(colors);
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function MetricInput({
  label,
  value,
  onChange,
  unit,
  colors,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  unit: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const styles = useThemedStyles(colors);
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <TextInput
        style={[styles.metricInput, { borderColor: colors.border, color: colors.text }]}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
  );
}

function useThemedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      padding: space.md,
      marginBottom: space.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowIcon: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.sm,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: space.sm,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: space.md,
      marginBottom: space.sm,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.5,
      color: colors.muted,
      textTransform: "uppercase",
    },
    metricsRow: {
      flexDirection: "row",
      gap: space.sm,
      marginBottom: space.md,
    },
    metricCard: {
      flex: 1,
      borderRadius: radius.lg,
      padding: space.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      ...shadow.card,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.muted,
    },
    metricInput: {
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
      borderBottomWidth: 1,
      paddingVertical: 4,
      minWidth: 50,
      marginVertical: 4,
    },
    metricUnit: {
      fontSize: 10,
      color: colors.muted,
    },
    inputRow: {
      flexDirection: "row",
      gap: space.sm,
      marginTop: space.sm,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.muted,
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: space.sm,
      paddingVertical: 10,
      fontSize: 14,
      fontWeight: "600",
    },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    addBtnPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.96 }],
    },
    addBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    emptyText: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: space.md,
    },
    hintText: {
      fontSize: 12,
      color: colors.muted,
      marginTop: space.sm,
    },
    errorText: {
      color: colors.red,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: space.md,
    },
    saveBtn: {
      backgroundColor: colors.text,
      borderRadius: radius.pill,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: space.sm,
    },
    saveBtnPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    saveBtnText: {
      color: colors.screen,
      fontSize: 15,
      fontWeight: "800",
    },
  });
}
