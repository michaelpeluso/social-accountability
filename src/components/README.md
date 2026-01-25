# Components

Reusable UI components organized by category. All components are controlled (parent manages state via props) and include self-contained styling.

## Directory Structure

```
src/components/
├── cards/              # Content cards and list items
│   ├── habits/         # Habit-specific cards
│   │   ├── CheckInList.tsx
│   │   ├── HabitDetailCard.tsx
│   │   ├── StatusBanner.tsx
│   │   ├── StreakDisplay.tsx
│   │   ├── TodayProgress.tsx
│   │   └── index.ts
│   ├── goals/          # Goal-specific cards
│   │   ├── GoalDetailCard.tsx
│   │   ├── LinkedHabitsList.tsx
│   │   ├── ProgressSummary.tsx
│   │   └── index.ts
│   ├── dashboard/      # Dashboard cards
│   │   ├── MissedCard.tsx
│   │   ├── NeedsAttentionCard.tsx
│   │   ├── OverallScoreCard.tsx
│   │   ├── PeakHoursCard.tsx
│   │   ├── PillarScoreCard.tsx
│   │   ├── RecoveryCard.tsx
│   │   ├── SummaryCard.tsx
│   │   ├── TopStreaksCard.tsx
│   │   └── index.ts
│   ├── GoalCard.tsx
│   ├── HabitCard.tsx
│   ├── PostCard.tsx
│   └── index.ts
├── charts/             # Data visualization
│   ├── ActivityChart.tsx
│   ├── CompletionTrendChart.tsx
│   ├── DayOfWeekChart.tsx
│   └── index.ts
├── forms/              # Form elements
│   ├── CustomTagInput.tsx
│   ├── FormField.tsx
│   ├── MediaPicker.tsx
│   ├── ObjectPicker.tsx
│   ├── PhotoPicker.tsx
│   ├── PillarChips.tsx
│   ├── PostTypeTagSelector.tsx
│   ├── PrivacySelector.tsx
│   └── index.ts
├── layout/             # Layout and navigation
│   ├── Avatar.tsx
│   ├── EmptyState.tsx
│   ├── PillarBadge.tsx
│   ├── ScreenHeader.tsx
│   ├── ScopeTabs.tsx
│   ├── SectionTitle.tsx
│   ├── TabBar.tsx
│   └── index.ts
├── modals/             # Modal dialogs
│   ├── CheckInModal.tsx
│   ├── EditHabitModal.tsx
│   ├── PillarDetailModal.tsx
│   └── index.ts
├── pickers/            # Selection components
│   └── pickerManager.ts
├── ErrorBoundary.tsx   # Error boundary wrapper
└── index.ts            # Main exports
```

## Usage Examples

### Layout Components

```tsx
import { ScreenHeader, EmptyState, SectionTitle, Avatar, PillarBadge } from "@/components";

// Screen header with back button
<ScreenHeader title="Dashboard" backLabel="Back" />

// Screen header with custom actions
<ScreenHeader
  title="New Post"
  leftAction={<Pressable onPress={cancel}><Text>Cancel</Text></Pressable>}
  rightAction={<Pressable onPress={submit}><Text>Post</Text></Pressable>}
/>

// Empty state with CTA
<EmptyState
  emoji="📊"
  title="No data yet"
  subtitle="Create your first habit to start tracking"
  ctaLabel="Create Habit"
  onCtaPress={() => router.push("/habits")}
/>

// Section title
<SectionTitle>This Week</SectionTitle>
<SectionTitle size="large">Dashboard</SectionTitle>
```

### Form Components

```tsx
import {
  FormField,
  PhotoPicker,
  MediaPicker,
  PrivacySelector,
  PillarChips,
  PostTypeTagSelector,
  CustomTagInput,
  ObjectPicker,
} from "@/components";

// Text input with validation
<FormField
  label="Display Name"
  required
  value={name}
  onChangeText={setName}
  maxLength={50}
  error={nameError}
/>

// Photo picker (for profile photos - circular)
<PhotoPicker value={photoUri} onChange={setPhotoUri} />

// Media picker (for posts - photo/video with preview)
<MediaPicker
  value={mediaAsset}
  onChange={setMediaAsset}
  allowVideo={true}
  allowCamera={true}
  placeholder="Add photo or video"
/>

// Privacy selector
<PrivacySelector value={privacy} onChange={setPrivacy} label="Who can see this?" />

// Pillar chips
<PillarChips value={pillar} onChange={setPillar} label="Life Area" />

// Post type tags
<PostTypeTagSelector value={tags} onChange={setTags} />

// Custom hashtag input
<CustomTagInput value={customTags} onChange={setCustomTags} maxTags={3} />

// Object picker (habits/goals)
<ObjectPicker
  habits={habits}
  goals={goals}
  value={linkedObject}
  onChange={setLinkedObject}
/>
```

### Card Components

```tsx
import {
  HabitCard,
  GoalCard,
  PostCard,
  HabitDetailCard,
  GoalDetailCard,
  LinkedHabitsList,
} from "@/components";

// Habit card in list
<HabitCard habit={habit} onPress={() => navigateToHabit(habit.id)} />

// Goal detail card
<GoalDetailCard goal={goal} />

// Linked habits list (for goal detail)
<LinkedHabitsList habits={linkedHabits} onHabitPress={navigateToHabit} />
```

### Dashboard Cards

```tsx
import {
  OverallScoreCard,
  PillarScoreCard,
  SummaryCard,
  NeedsAttentionCard,
  TopStreaksCard,
  RecoveryCard,
  MissedCard,
  PeakHoursCard,
} from "@/components/cards";

<OverallScoreCard score={pillarData.overall} activeHabits={habitSummary.activeHabits} />
<PillarScoreCard score={score} onPress={() => handlePillarTap(score)} />
<SummaryCard checkInsThisWeek={10} completionRate={85} checkInsToday={3} />
```

### Modal Components

```tsx
import { CheckInModal, EditHabitModal, PillarDetailModal } from "@/components";

<CheckInModal
  visible={showCheckIn}
  onClose={() => setShowCheckIn(false)}
  habit={habit}
  onSubmit={handleCheckIn}
/>

<EditHabitModal
  visible={showEdit}
  onClose={() => setShowEdit(false)}
  habit={habit}
  onSave={handleSave}
/>
```

## Component Guidelines

1. **Controlled Components**: All components receive state via props and notify parent of changes via callbacks
2. **Self-contained Styles**: Use `StyleSheet.create()` within each component
3. **Theme Integration**: Use `useTheme()` hook for colors, `spacing`, `borderRadius`, `typography` from theme
4. **TypeScript Props**: Every component has a typed interface for props
5. **Platform Handling**: Handle iOS/Android differences inside components, not in consuming screens
6. **Single Input Rule**: Only one picker/modal can be open at a time (managed via pickerManager)
