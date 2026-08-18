import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SlotCell } from '@/types/user';
import { Colors } from '@/constants/colors';
import { AccessibleText } from '@/components/AccessibleText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const AVAILABLE = '#5ecf83';
const BOOKED = '#f28b9f';
const BLOCKED = '#8a9aa8';
const CLOSED_BG = 'rgba(120,120,120,0.3)';

const LABEL_COL_WIDTH = 48;
const ROW_HEIGHT = 30;
const CELL_MIN_WIDTH = 34;

type TimeRef = { date: string; time: string };

function keyOf(ref: TimeRef) {
  return `${ref.date}T${ref.time}`;
}

function parseDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function weekdayOf(dateStr: string) {
  return WEEKDAYS_ES[parseDate(dateStr).getDay()];
}

function dayNumber(dateStr: string) {
  return parseDate(dateStr).getDate();
}

function monthLabelOf(dateStr: string) {
  const [y, m] = dateStr.split('-').map(Number);
  return `${MONTHS_ES[m - 1]} ${y}`;
}

export function suggestNextSlot(cells: SlotCell[], preferredStart: string): string | null {
  const sorted = [...cells].sort((a, b) => a.start.localeCompare(b.start));
  const atOrAfter = sorted.find(
    (c) => c.state === 'available' && c.start >= preferredStart
  );
  if (atOrAfter) return atOrAfter.start;
  const firstAvailable = sorted.find((c) => c.state === 'available');
  return firstAvailable ? firstAvailable.start : null;
}

interface SlotGridProps {
  days: { date: string; cells: SlotCell[] }[];
  selectedStart?: TimeRef | null;
  selectedEnd?: TimeRef | null;
  onSelectRange: (
    start: TimeRef,
    end: TimeRef | null
  ) => void;
  onSuggest?: (date: string, suggestedTime: string, originalTime: string) => void;
  onMonthChange?: (monthStartDate: string) => void;
}

export function SlotGrid({
  days,
  selectedStart,
  selectedEnd,
  onSelectRange,
  onSuggest,
  onMonthChange = () => {},
}: SlotGridProps) {
  const [monthsVisible, setMonthsVisible] = useState(false);

  const orderedTimes = useMemo(() => {
    const set = new Set<string>();
    days.forEach((d) => d.cells.forEach((c) => set.add(c.start)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [days]);

  const cellWidth = useMemo(() => {
    const n = days.length || 1;
    return Math.max(
      CELL_MIN_WIDTH,
      Math.floor((SCREEN_WIDTH - 40 - LABEL_COL_WIDTH) / n)
    );
  }, [days]);

  const anchorDate = days.length > 0 ? days[0].date : '';
  const monthLabel = anchorDate ? monthLabelOf(anchorDate) : '';
  const currentMonthKey = anchorDate
    ? `${anchorDate.slice(0, 7)}-01`
    : '';

  const monthOptions = useMemo(() => {
    if (!anchorDate) return [];
    const [y, m] = anchorDate.split('-').map(Number);
    const out: { key: string; label: string; firstDay: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(y, m - 1 + i, 1);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
        label: `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`,
        firstDay: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      });
    }
    return out;
  }, [anchorDate]);

  const inRange = (date: string, cell: SlotCell): boolean => {
    if (!selectedStart) return false;
    const cellKey = keyOf({ date, time: cell.start });
    const startKey = keyOf(selectedStart);
    if (cellKey < startKey) return false;
    if (!selectedEnd) return cellKey === startKey;
    const endKey = keyOf(selectedEnd);
    return cellKey < endKey;
  };

  const isStartCell = (date: string, cell: SlotCell): boolean =>
    !!selectedStart &&
    selectedStart.date === date &&
    selectedStart.time === cell.start;

  const isEndCell = (date: string, cell: SlotCell): boolean =>
    !!selectedEnd &&
    selectedEnd.date === date &&
    selectedEnd.time === cell.start;

  const handleCellPress = (day: { date: string; cells: SlotCell[] }, cell: SlotCell) => {
    const tapped: TimeRef = { date: day.date, time: cell.start };
    if (cell.state !== 'available') {
      if (onSuggest) {
        const suggested = suggestNextSlot(day.cells, cell.start);
        if (suggested) onSuggest(day.date, suggested, cell.start);
      }
      return;
    }
    if (!selectedStart) {
      onSelectRange(tapped, null);
      return;
    }
    if (keyOf(tapped) > keyOf(selectedStart)) {
      onSelectRange(selectedStart, tapped);
    } else {
      onSelectRange(tapped, null);
    }
  };

  const cellKind = (day: { date: string; cells: SlotCell[] }, time: string) => {
    const cell = day.cells.find((c) => c.start === time);
    if (!cell) return null;
    return {
      cell,
      selected: inRange(day.date, cell),
      isStart: isStartCell(day.date, cell),
      isEnd: isEndCell(day.date, cell),
    };
  };

  const renderSelectedOverlay = (kind: NonNullable<ReturnType<typeof cellKind>>) => {
    if (!kind.selected) return null;
    return <View pointerEvents="none" style={styles.selectedOverlay} />;
  };

  const renderClosedHatch = () => (
    <View pointerEvents="none" style={styles.fill}>
      {[4, 11, 18, 25].map((top) => (
        <View key={top} style={[styles.hatchStripe, { top }]} />
      ))}
    </View>
  );

  const renderCell = (
    day: { date: string; cells: SlotCell[] },
    time: string
  ) => {
    const kind = cellKind(day, time);
    if (!kind) {
      return <View key={`${day.date}-${time}`} style={[styles.cell, styles.emptyCell]} />;
    }
    const { cell } = kind;
    const base = [
      styles.cell,
      cell.state === 'available' && styles.cellAvailable,
      cell.state === 'booked' && styles.cellBooked,
      cell.state === 'blocked' && styles.cellBlocked,
      cell.state === 'closed' && styles.cellClosed,
      kind.selected && styles.cellSelectedBoundary,
      kind.isStart && styles.cellStart,
    ];
    const accessibilityLabel = `${weekdayOf(day.date)} ${dayNumber(day.date)} · ${cell.start} ${
      cell.state === 'available'
        ? 'disponible'
        : cell.state === 'booked'
          ? 'reservado'
          : cell.state === 'blocked'
            ? 'bloqueado'
            : 'cerrado'
    }`;
    return (
      <TouchableOpacity
        key={`${day.date}-${time}`}
        style={base}
        activeOpacity={cell.state === 'available' ? 0.7 : 1}
        onPress={() => handleCellPress(day, cell)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {cell.state === 'closed' && renderClosedHatch()}
        {kind.selected && renderSelectedOverlay(kind)}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.monthHeader}
        activeOpacity={0.8}
        onPress={() => setMonthsVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Mes actual: ${monthLabel}. Toca para cambiar de mes.`}
      >
        <AccessibleText style={styles.monthLabel}>{monthLabel}</AccessibleText>
        <Text style={styles.monthCaret} accessibilityElementsHidden>
          ▾
        </Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={[styles.row, { height: ROW_HEIGHT + 6 }]}>
              <View style={{ width: LABEL_COL_WIDTH }} />
              {days.map((day) => (
                <View
                  key={day.date}
                  style={[styles.dayHeader, { width: cellWidth }]}
                >
                  <Text style={styles.dayName}>{weekdayOf(day.date)}</Text>
                  <Text style={styles.dayNumber}>{dayNumber(day.date)}</Text>
                </View>
              ))}
            </View>

            {orderedTimes.length === 0 && (
              <View style={styles.emptyState}>
                <AccessibleText style={styles.emptyText}>
                  Sin horarios disponibles
                </AccessibleText>
              </View>
            )}

            {orderedTimes.map((time) => (
              <View key={time} style={[styles.row, { height: ROW_HEIGHT }]}>
                <View style={styles.labelCol}>
                  <AccessibleText style={styles.timeLabel}>{time}</AccessibleText>
                </View>
                {days.map((day) => (
                  <View key={day.date} style={{ width: cellWidth }}>
                    {renderCell(day, time)}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      <Modal
        visible={monthsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMonthsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <AccessibleText accessibilityRole="header" style={styles.modalTitle}>
              Ir al mes
            </AccessibleText>
            <View style={styles.monthGrid}>
              {monthOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.monthOption,
                    opt.firstDay === currentMonthKey &&
                      styles.monthOptionActive,
                  ]}
                  onPress={() => {
                    onMonthChange(opt.firstDay);
                    setMonthsVisible(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                >
                  <Text
                    style={[
                      styles.monthOptionText,
                      opt.firstDay === currentMonthKey &&
                        styles.monthOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setMonthsVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginRight: 6,
  },
  monthCaret: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 2,
  },
  gridContent: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelCol: {
    width: LABEL_COL_WIDTH,
    paddingRight: 4,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 10,
    color: Colors.textLight,
    fontWeight: '600',
  },
  dayHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text,
  },
  dayNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    marginTop: 1,
  },
  cell: {
    margin: 1,
    borderRadius: 6,
    flex: 1,
    overflow: 'hidden',
    minHeight: ROW_HEIGHT - 2,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  cellAvailable: {
    backgroundColor: AVAILABLE,
  },
  cellBooked: {
    backgroundColor: BOOKED,
  },
  cellBlocked: {
    backgroundColor: BLOCKED,
  },
  cellClosed: {
    backgroundColor: CLOSED_BG,
  },
  cellSelectedBoundary: {
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cellStart: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  selectedOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  hatchStripe: {
    position: 'absolute',
    left: -8,
    right: -8,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    transform: [{ rotate: '45deg' }],
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthOption: {
    width: '33.33%',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  monthOptionActive: {
    backgroundColor: Colors.primary + '18',
  },
  monthOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    textAlign: 'center',
  },
  monthOptionTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  modalCloseBtn: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textLight,
  },
});