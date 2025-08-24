// components/feed/postItem.tsx
import { firestore } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Post = {
  id: string;
  authorId: string;
  title?: string | null;
  content?: string | null;
  mediaUrls?: string[];
  price?: number | null;
};

type UserLite = {
  displayName?: string;
  avatar?: string;
};

export default function PostItem({ post }: { post: Post }) {
  const router = useRouter();
  const [author, setAuthor] = useState<UserLite | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(firestore, 'users', post.authorId));
        setAuthor((snap.exists() ? snap.data() : null) as UserLite | null);
      } catch {
        setAuthor(null);
      }
    })();
  }, [post.authorId]);

  const cover = post.mediaUrls?.[0];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push(`/profile/${post.authorId}`)}>
      {/* Header auteur */}
      <View style={styles.header}>
        <Image
          source={{ uri: author?.avatar || 'https://ui-avatars.com/api/?background=333&color=fff&name=' + (author?.displayName || 'U') }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{author?.displayName || 'Utilisateur'}</Text>
          {post.price != null && <Text style={styles.sub}>{post.price} €</Text>}
        </View>
      </View>

      {/* Image / contenu */}
      {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : null}

      {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10, backgroundColor: '#444' },
  name: { color: '#fff', fontWeight: '700' },
  sub: { color: '#bdbdbd', fontSize: 12, marginTop: 2 },
  cover: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10, backgroundColor: '#222' },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  content: { color: '#ddd' },
});
