// Path: components/feed/postItem.tsx
import { firestore } from "@/lib/firebase";
import type { Post as PostType, User as UserType } from "@/types";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type MinimalUser = Pick<UserType, "displayName" | "email" | "avatar">;

export default function PostItem({ post }: { post: PostType }) {
  const router = useRouter();
  const [author, setAuthor] = useState<MinimalUser | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(firestore, "users", post.authorId));
        if (mounted) setAuthor(snap.exists() ? (snap.data() as MinimalUser) : null);
      } catch {
        if (mounted) setAuthor(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [post.authorId]);

  const cover = (post as any).mediaUrls?.[0];

  // Prefer displayName; fallback to email local-part then generic
  const name =
    (author?.displayName && author.displayName.trim()) ||
    author?.email?.split("@")[0] ||
    "Utilisateur";

  const avatarUri = author?.avatar?.trim();
  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : require("@/assets/images/avatar-placeholder.png");

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/profile/${post.authorId}`)}
    >
      <View style={styles.header}>
        <Image source={avatarSource} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
        </View>
      </View>

      {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : null}
      {(post as any).title ? <Text style={styles.title}>{(post as any).title}</Text> : null}
      {(post as any).content ? <Text style={styles.content}>{(post as any).content}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10, backgroundColor: "#444" },
  name: { color: "#fff", fontWeight: "700" },
  cover: { width: "100%", height: 200, borderRadius: 10, marginBottom: 10, backgroundColor: "#222" },
  title: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  content: { color: "#ddd" },
});
