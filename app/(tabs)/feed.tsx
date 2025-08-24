// app/(tabs)/feed.tsx
import PostItem from '@/components/feed/postItem';
import { firestore } from '@/lib/firebase';
import PageContainer from '@/theme/PageContainer';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

type PostDoc = {
  id: string;
  authorId: string;
  title?: string | null;
  content?: string | null;
  mediaUrls?: string[];
  price?: number | null;
  createdAt?: any;
};

export default function Feed() {
  const [posts, setPosts] = useState<PostDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: PostDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as PostDoc) }));
      setPosts(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <PageContainer title="Feed" showBackButton={false}>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Feed" showBackButton={false}>
      {posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: '#ccc' }}>Aucun post pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 0, paddingBottom: 30 }}
          renderItem={({ item }) => <PostItem post={item} />}
        />
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
