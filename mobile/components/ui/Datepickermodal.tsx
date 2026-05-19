/**
 * DatePickerModal — Custom inline calendar, no external dependencies.
 * Usage:
 *   <DatePickerModal
 *     visible={show}
 *     value={isoString}          // "" or ISO date string
 *     onConfirm={(iso) => ...}   // called with ISO string e.g. "2025-12-31T00:00:00.000Z"
 *     onClose={() => setShow(false)}
 *   />
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing, Radius } from '../../constants/theme';

const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

interface Props {
  visible:   boolean;
  value:     string;   // ISO or ""
  onConfirm: (iso: string) => void;
  onClose:   () => void;
  minDate?:  Date;
}

export function DatePickerModal({ visible, value, onConfirm, onClose, minDate }: Props) {
  const { colors } = useTheme();

  const today = new Date();
  const init  = value ? new Date(value) : today;

  const [year,  setYear]  = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());       // 0-based
  const [day,   setDay]   = useState(value ? init.getDate() : 0); // 0 = nothing selected

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      const d = value ? new Date(value) : today;
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      setDay(value ? d.getDate() : 0);
    }
  }, [visible]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDow   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const isDisabled = (d: number) => {
    if (!minDate) return false;
    const cell = new Date(year, month, d);
    cell.setHours(0,0,0,0);
    const min  = new Date(minDate);
    min.setHours(0,0,0,0);
    return cell < min;
  };

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const handleConfirm = () => {
    if (!day) return;
    const iso = new Date(year, month, day).toISOString();
    onConfirm(iso);
    onClose();
  };

  const selectedLabel = day
    ? `${MONTHS[month]} ${day}, ${year}`
    : 'Select a date';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>

          {/* ── Header ── */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Pick a Date</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* ── Month nav ── */}
          <View style={styles.monthNav}>
            <Pressable onPress={prevMonth} hitSlop={10} style={[styles.navBtn, { backgroundColor: colors.surfaceContainer }]}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {MONTHS[month]} {year}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={10} style={[styles.navBtn, { backgroundColor: colors.surfaceContainer }]}>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* ── Day-of-week labels ── */}
          <View style={styles.dowRow}>
            {DAYS.map((d) => (
              <Text key={d} style={[styles.dowLabel, { color: colors.textMuted }]}>{d}</Text>
            ))}
          </View>

          {/* ── Calendar grid ── */}
          <View style={styles.grid}>
            {cells.map((d, i) => {
              if (!d) return <View key={`e-${i}`} style={styles.cell} />;
              const selected  = d === day;
              const disabled  = isDisabled(d);
              const todayCell = isToday(d);
              return (
                <Pressable
                  key={d}
                  style={[
                    styles.cell,
                    selected  && { backgroundColor: colors.primary, borderRadius: Radius.full },
                    !selected && todayCell && { borderWidth: 1.5, borderRadius: Radius.full, borderColor: colors.primary },
                  ]}
                  onPress={() => !disabled && setDay(d)}
                  disabled={disabled}
                >
                  <Text style={[
                    styles.cellText,
                    { color: selected ? '#FFF' : disabled ? colors.textMuted : colors.text },
                    todayCell && !selected && { color: colors.primary, fontWeight: Typography.bold },
                  ]}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Selected label ── */}
          <View style={[styles.selectedRow, { backgroundColor: colors.surfaceContainer }]}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.selectedText, { color: day ? colors.text : colors.textMuted }]}>
              {selectedLabel}
            </Text>
          </View>

          {/* ── Confirm ── */}
          <Pressable
            style={[styles.confirmBtn, { backgroundColor: day ? colors.primary : colors.surfaceContainerHigh }]}
            onPress={handleConfirm}
            disabled={!day}
          >
            <Text style={[styles.confirmText, { color: day ? '#FFF' : colors.textMuted }]}>Confirm</Text>
          </Pressable>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Spacing.base },
  sheet:        { width: '100%', borderRadius: Radius['2xl'], padding: Spacing.base, gap: Spacing.md },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.sm, borderBottomWidth: 1 },
  sheetTitle:   { fontSize: Typography.md, fontWeight: '700' },

  monthNav:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn:       { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  monthLabel:   { fontSize: Typography.base, fontWeight: '700' },

  dowRow:       { flexDirection: 'row', justifyContent: 'space-around' },
  dowLabel:     { width: CELL_SIZE, textAlign: 'center', fontSize: Typography.xs, fontWeight: '600' },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  cell:         { width: `${100/7}%`, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
  cellText:     { fontSize: Typography.sm },

  selectedRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.sm, borderRadius: Radius.md },
  selectedText: { fontSize: Typography.sm },

  confirmBtn:   { paddingVertical: 13, borderRadius: Radius.md, alignItems: 'center' },
  confirmText:  { fontSize: Typography.base, fontWeight: '700' },
});