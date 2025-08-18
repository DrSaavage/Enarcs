import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  id: string;
  senderName: string;
  lastMessage: string;
  time: string;
  avatarUrl: string;
  unreadCount?: number;
};

export default function MessageItem({
  id,
  senderName,
  lastMessage,
  time,
  avatarUrl,
  unreadCount = 0,
}: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/messages/${id}`)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />

      <View style={styles.textContainer}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{senderName}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        <View style={styles.bottomRow}>
          {/* lastMessage sur une seule ligne avec ... */}
          {lastMessage !== "" && (
            <Text
              style={styles.message}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {lastMessage}
            </Text>
          )}
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "transparent",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#ffffff20",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
    flexShrink: 1,
    maxWidth: "70%",
  },
  time: {
    fontSize: 13,
    color: "#aaa",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  message: {
    color: "#ccc",
    fontSize: 14,
    flex: 1,
    maxWidth: "85%", // <-- pour l'ellipsis si badge présent
  },
  badge: {
    backgroundColor: "#3F8AFF",
    borderRadius: 12,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
