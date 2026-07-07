import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Option {
  label: string;
  value: string | number;
}

interface SelectModalProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value?: string | number | null;
  onChange: (value: string | number) => void;
  error?: string;
  searchable?: boolean;
}

export function SelectModal({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  error,
  searchable = false,
}: SelectModalProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = searchable
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            borderColor: error ? colors.destructive : colors.input,
            backgroundColor: colors.card,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            { color: selected ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
      </Pressable>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      )}

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, borderRadius: colors.radius + 8 },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                {label ?? "Select"}
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {searchable && (
              <View
                style={[
                  styles.searchRow,
                  { borderColor: colors.input, backgroundColor: colors.muted, borderRadius: colors.radius },
                ]}
              >
                <Feather name="search" size={16} color={colors.mutedForeground} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                />
              </View>
            )}
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        item.value === value
                          ? colors.secondary
                          : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          item.value === value
                            ? colors.primary
                            : colors.foreground,
                        fontFamily:
                          item.value === value
                            ? "Inter_600SemiBold"
                            : "Inter_400Regular",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Feather name="check" size={16} color={colors.primary} />
                  )}
                </Pressable>
              )}
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  trigger: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  triggerText: { fontSize: 15, fontFamily: "Inter_400Regular", flex: 1 },
  error: { fontSize: 12, fontFamily: "Inter_400Regular" },
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    maxHeight: "75%",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 15 },
});
