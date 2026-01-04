# Shared Components Architecture

## Overview

The `/src/components` directory contains reusable UI components organized by category for scalability and maintainability across the app.

## Directory Structure

```
src/components/
├── index.ts              # Main export file
├── pickers/              # Selection/picker components
│   ├── index.ts
│   ├── DatePicker.tsx
│   ├── IdentityPicker.tsx
│   ├── PillarPicker.tsx
│   ├── PrivacyPicker.tsx
│   └── DataSourcePicker.tsx
├── forms/                # Form input components (future)
└── cards/                # Card/list item components (future)
```

## Component Categories

### Pickers (`/pickers`)

Reusable selection components for choosing from predefined options.

#### **DatePicker**

- **Purpose**: Native date selection with iOS/Android platform optimization
- **Commit Mode**: `draft` (requires explicit Cancel/Done per Input System Specification)
- **Props**:
  - `label: string` - Label displayed above input (also shown in modal header)
  - `value: Date | undefined` - Currently selected date
  - `onChange: (date: Date) => void` - Callback when date is committed
  - `error?: string` - Optional error message
  - `placeholder?: string` - Placeholder text when no date selected
  - `minimumDate?: Date` - Earliest selectable date
  - `maximumDate?: Date` - Latest selectable date
- **Features**:
  - **Always modal**: Centered modal presentation prevents clipping
  - **Draft mode**: Selection updates draft; only commits on Done
  - **Cancel/Done header**: iOS-standard header with explicit actions
  - **Single active input**: Registers with `pickerManager` to close other pickers
  - Auto-detects iOS version for inline calendar (iOS 14+) vs spinner
  - Proper light mode theming with `themeVariant="light"`
  - Backdrop tap = cancel (no commit)
  - Android uses native picker dialog (auto-commits on selection per platform convention)
- **Usage**:

  ```tsx
  <DatePicker
    label="Start Date"
    value={startDate}
    onChange={setStartDate}
    error={startDateError}
    placeholder="Tap to choose"
  />

  <DatePicker
    label="Deadline"
    value={deadline}
    onChange={setDeadline}
    minimumDate={startDate}
    placeholder="Tap to choose (indefinite)"
  />
  ```

#### **IdentityPicker**

- **Purpose**: Select an identity or "None"
- **Props**:
  - `options: IdentityOption[]` - Available identities with icons and pillar mappings
  - `selected: IdentityPreset | undefined` - Currently selected identity
  - `onSelect: (identity: IdentityPreset | undefined) => void` - Selection callback
  - `showNone?: boolean` - Show "None" option (default: true)
- **Usage**:
  ```tsx
  <IdentityPicker
    options={IDENTITY_PRESETS}
    selected={selectedIdentity}
    onSelect={setSelectedIdentity}
  />
  ```

#### **PillarPicker**

- **Purpose**: Select a pillar (BODY, MIND, HEART, SOUL)
- **Props**:
  - `selected: Pillar` - Currently selected pillar
  - `onSelect: (pillar: Pillar) => void` - Selection callback
  - `locked?: boolean` - Disable interaction and show locked state
  - `lockedReason?: string` - Reason displayed when locked
- **Features**: Automatically locks and shows reason when identity auto-selects pillar
- **Usage**:
  ```tsx
  <PillarPicker
    selected={effectivePillar}
    onSelect={setSelectedPillar}
    locked={!!selectedIdentity}
    lockedReason={selectedIdentity ? `auto-selected from ${selectedIdentity}` : undefined}
  />
  ```

#### **PrivacyPicker**

- **Purpose**: Select privacy level (SELF, FRIENDS, PUBLIC)
- **Props**:
  - `options: Privacy[]` - Available privacy levels
  - `selected: Privacy` - Currently selected privacy
  - `onSelect: (privacy: Privacy) => void` - Selection callback
- **Usage**:
  ```tsx
  <PrivacyPicker
    options={PRIVACY_OPTIONS}
    selected={selectedPrivacy}
    onSelect={setSelectedPrivacy}
  />
  ```

#### **DataSourcePicker**

- **Purpose**: Select tracking method for goals/habits
- **Props**:
  - `options: DataSourceOption[]` - Available data sources with enabled states
  - `selected: GoalDataSource` - Currently selected source
  - `onSelect: (source: GoalDataSource) => void` - Selection callback
- **Features**: Shows "Coming soon" badge for disabled options
- **Usage**:
  ```tsx
  <DataSourcePicker options={DATA_SOURCE_OPTIONS} selected={dataSource} onSelect={setDataSource} />
  ```

## Design Principles

### 1. **Single Responsibility**

Each component handles one specific UI pattern (e.g., identity selection, pillar selection).

### 2. **Controlled Components**

All pickers are controlled components - parent manages state via `selected` and `onSelect` props.

### 3. **Consistent API**

Similar components follow the same prop patterns:

- `selected` - current value
- `onSelect` - callback function
- `options` - available choices (when applicable)

### 4. **Self-Contained Styles**

Each component includes its own styles using StyleSheet.create() to avoid conflicts.

### 5. **Single Active Input**

- **Only one input modal or picker may be open at a time.** Components that present native pickers (date, action sheets, etc.) must register with the centralized picker manager (`src/components/pickers/pickerManager.ts`) which ensures previously-open pickers are closed before opening a new one.
- Inline-style pickers (iOS 14+ inline calendar) are rendered inside a centered modal by default to avoid layout clipping inside complex screens.

### 5. **Type Safety**

All components are fully typed with TypeScript interfaces for props and data structures.

## Extending the Architecture

### Adding a New Picker Component

1. Create the component file in `/src/components/pickers/`
2. Follow the controlled component pattern
3. Export from `/src/components/pickers/index.ts`
4. Use consistent prop naming (`selected`, `onSelect`, `options`)

Example template:

```tsx
interface MyPickerProps {
  options: MyOption[];
  selected: MyValue;
  onSelect: (value: MyValue) => void;
}

export function MyPicker({ options, selected, onSelect }: MyPickerProps) {
  return (
    <View>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[styles.option, selected === option.value && styles.selected]}
          onPress={() => onSelect(option.value)}
        >
          <Text>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /* ... */
});
```

### Adding New Component Categories

1. Create a new subdirectory in `/src/components/` (e.g., `/forms`, `/cards`, `/modals`)
2. Add an `index.ts` export file for the category
3. Update `/src/components/index.ts` to export the new category
4. Follow consistent naming and patterns

## Usage in Screens

Import from the main components barrel export:

```tsx
import {
  IdentityPicker,
  PillarPicker,
  PrivacyPicker,
  DataSourcePicker,
} from "../../src/components";
```

This allows for:

- Clean imports
- Easy component discovery
- Centralized exports that can be refactored without changing import paths

## Migration from Screen-Specific Components

When extracting UI from existing screens:

1. Identify reusable patterns (repeated across 2+ screens or likely to be)
2. Extract to shared component with generic props
3. Replace screen-specific code with component import
4. Remove screen-specific styles
5. Test in all usage locations

## Future Enhancements

- **Forms**: FormField, FormSection wrappers
- **Cards**: GoalCard, HabitCard, PostCard components
- **Modals**: Standard modal layouts
- **Buttons**: Reusable button variants
- **Inputs**: Standard text/numeric input wrappers
- **Date Pickers**: Wrapper around DateTimePicker for consistent UX
