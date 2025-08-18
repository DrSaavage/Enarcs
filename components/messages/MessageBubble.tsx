// /components/messages/MessageBubble.tsx

import { StyleSheet, Text, View } from "react-native";

type Props = {
  text: string;
  isMine?: boolean;
  time?: string;
};

export default function MessageBubble({ text, isMine = false, time }: Props) {
  return (
    <View style={[styles.container, isMine ? styles.mine : styles.theirs]}>
      <Text style={styles.message}>{text}</Text>
      {time && <Text style={styles.time}>{time}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "77%",
    marginVertical: 4,
    padding: 10,
    borderRadius: 16,
    minHeight: 40,
    justifyContent: "flex-end",
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: "#3F8AFF",
    borderTopRightRadius: 5,
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: "#232323",
    borderTopLeftRadius: 5,
  },
  message: {
    color: "#fff",
    fontSize: 15,
  },
  time: {
    alignSelf: "flex-end",
    fontSize: 11,
    color: "#b3b3b3",
    marginTop: 3,
  },
});
