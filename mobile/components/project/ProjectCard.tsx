/**
 * ProjectCard Component
 * Displays a project with status badge, progress bar, members, and dates.
 * Mirrors the web's ProjectCard with a mobile-first design.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../ui/Card';
import { Badge, AvatarStack, ProgressBar } from '../ui/index';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing, Radius } from '../../constants/theme';
import { Project } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  todo:               'To Do',
  in_progress:        'In Progress',
  ready_for_review:   'Review',
  done:               'Done',
  on_hold:            'On Hold',
};

const TYPE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'Web Application': 'globe-outline',
  'Mobile Application': 'phone-portrait-outline',
  'Security System': 'shield-outline',
  'AI/ML': 'sparkles-outline',
};

interface ProjectCardProps {
  project: Project;
  onPress: (project: Project) => void;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const { colors } = useTheme();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

  const icon = TYPE_ICONS[project.projectType?.name ?? ''] ?? 'folder-outline';

  return (
    <Card onPress={() => onPress(project)} style={styles.card}>
      {/* Top row: type icon + status badge */}
      <View style={styles.topRow}>
        <View style={[styles.typeIcon, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Badge
          label={STATUS_LABELS[project.status] ?? project.status}
          variant={project.status}
          size="sm"
        />
      </View>

      {/* Project name */}
      <Text
        style={[
          styles.name,
          {
            color: colors.text,
            textDecorationLine: project.status === 'done' ? 'line-through' : 'none',
            opacity: project.status === 'done' ? 0.6 : 1,
          },
        ]}
        numberOfLines={2}
      >
        {project.name}
      </Text>

      {/* Client name */}
      <Text style={[styles.client, { color: colors.textSecondary }]} numberOfLines={1}>
        {project.client.name}
      </Text>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Progress</Text>
          <Text style={[styles.progressValue, { color: colors.primary }]}>{project.progress}%</Text>
        </View>
        <ProgressBar value={project.progress} height={5} />
      </View>

      {/* Footer: dates + team avatars */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {formatDate(project.startDate)} → {formatDate(project.endDate)}
          </Text>
        </View>
        <AvatarStack users={project.members} max={3} size={24} />
      </View>

      {/* Task breakdown pills */}
      <View style={styles.taskBreakdown}>
        <TaskPill count={project.taskCount.done} label="Done" color={colors.success} bgColor={colors.successLight} />
        <TaskPill count={project.taskCount.inProgress} label="Active" color={colors.primary} bgColor={colors.primaryLight} />
        <TaskPill count={project.taskCount.todo} label="Todo" color={colors.textMuted} bgColor={colors.surfaceContainerHigh} />
      </View>
    </Card>
  );
}

function TaskPill({
  count,
  label,
  color,
  bgColor,
}: {
  count: number;
  label: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.taskPill, { backgroundColor: bgColor }]}>
      <Text style={[styles.taskPillCount, { color }]}>{count}</Text>
      <Text style={[styles.taskPillLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    lineHeight: 22,
  },
  client: {
    fontSize: Typography.sm,
  },
  progressSection: { gap: 6 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: { fontSize: Typography.xs },
  progressValue: { fontSize: Typography.xs, fontWeight: Typography.bold },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: Typography.xs },

  taskBreakdown: { flexDirection: 'row', gap: Spacing.sm },
  taskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  taskPillCount: { fontSize: Typography.xs, fontWeight: Typography.bold },
  taskPillLabel: { fontSize: Typography.xs },
});
