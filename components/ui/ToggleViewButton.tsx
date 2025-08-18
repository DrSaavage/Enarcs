// ToggleViewButton.tsx
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

type Props = {
  viewMode: 'list' | 'map';
  setViewMode: (mode: 'list' | 'map') => void;
};

export default function ToggleViewButton({ viewMode, setViewMode }: Props) {
  return (
    <Pressable onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}>
      <Ionicons
        name={viewMode === 'list' ? 'map-outline' : 'list-outline'}
        size={24}
        color="white"
        style={{ marginLeft: 10 }}
      />
    </Pressable>
  );
}
