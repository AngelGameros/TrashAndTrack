import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  ScrollView,
} from "react-native";
import { auth, db } from "../../config/Firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";

export default function ChatScreen() {
  const [admins, setAdmins] = useState([]);
  const [adminNamesMap, setAdminNamesMap] = useState({});
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardKey, setKeyboardKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef(null);

  const currentUser = auth.currentUser;
  const userUID = currentUser?.uid;

  const getChatRoomId = (uid1, uid2) => [uid1, uid2].sort().join("_");

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      setKeyboardKey((prev) => prev + 1); // fuerza re-render del KeyboardAvoidingView
    });
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchAdmins = () => {
    setLoadingAdmins(true);
    const q = query(
      collection(db, "usersApproval"),
      where("accountType", "==", "admin")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const adminsList = [];
        const namesMap = {};
        snapshot.docs.forEach((d) => {
          const adminData = d.data();
          const adminUid = d.id;
          const fullName = [adminData.nombre, adminData.apellidoPaterno]
            .filter(Boolean)
            .join(" ");
          adminsList.push({ uid: adminUid, name: fullName, email: adminData.email });
          namesMap[adminUid] = fullName || adminData.email;
        });
        setAdmins(adminsList);
        setAdminNamesMap(namesMap);
        setLoadingAdmins(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("Error al cargar administradores:", error);
        Alert.alert("Error", "No se pudo cargar la lista de administradores.");
        setLoadingAdmins(false);
        setRefreshing(false);
      }
    );
    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeAdmins = fetchAdmins();
    return () => unsubscribeAdmins && unsubscribeAdmins();
  }, []);

  useEffect(() => {
    let unsubscribe = null;
    if (userUID && selectedAdmin) {
      setLoadingMessages(true);

      const chatRoomId = getChatRoomId(userUID, selectedAdmin.uid);
      const chatMessagesRef = collection(db, "privateChats", chatRoomId, "messages");
      const q = query(chatMessagesRef, orderBy("timestamp", "asc"));

      const userChatMetadataRef = doc(db, "chats", userUID);
      setDoc(
        userChatMetadataRef,
        {
          lastActive: serverTimestamp(),
          userEmail: currentUser?.email,
          userName: currentUser?.displayName || userUID,
          lastChatWithAdmin: selectedAdmin.uid,
        },
        { merge: true }
      ).catch((error) =>
        console.error("Error al actualizar metadata del chat:", error)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setMessages(msgs);
          setLoadingMessages(false);
          setRefreshing(false);
          if (flatListRef.current && msgs.length > 0) {
            setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
          }
        },
        (error) => {
          console.error("Error al obtener mensajes:", error);
          Alert.alert("Error", "No se pudieron cargar los mensajes de la conversación.");
          setLoadingMessages(false);
          setRefreshing(false);
        }
      );
    } else {
      setMessages([]);
      setLoadingMessages(false);
      setRefreshing(false);
    }
    return () => unsubscribe && unsubscribe();
  }, [userUID, selectedAdmin]);

  const onRefresh = () => {
    setRefreshing(true);
    if (!selectedAdmin) {
      // Refrescar admins
      fetchAdmins();
    } else {
      // Refrescar mensajes
      // Esto se hace con onSnapshot en tiempo real, pero si quieres forzar recarga,
      // puedes reiniciar la suscripción o hacer fetch manual.
      // Aquí solo para ejemplo forzamos carga quitando y poniendo selectedAdmin:
      setSelectedAdmin(null);
      setTimeout(() => setSelectedAdmin((prev) => prev), 500);
      setRefreshing(false);
    }
  };

  const handleSelectAdmin = (admin) => {
    setSelectedAdmin(admin);
    setMessages([]);
    setInputText("");
  };

  const sendMessage = async () => {
    if (inputText.trim() === "" || !userUID || !selectedAdmin) return;
    try {
      const chatRoomId = getChatRoomId(userUID, selectedAdmin.uid);
      const chatMessagesRef = collection(db, "privateChats", chatRoomId, "messages");
      await addDoc(chatMessagesRef, {
        text: inputText,
        senderId: userUID,
        senderType: "user",
        timestamp: serverTimestamp(),
        recipientId: selectedAdmin.uid,
      });
      setInputText("");
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      Alert.alert("Error", "No se pudo enviar el mensaje.");
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === userUID;
    const senderLabel = isMyMessage
      ? "Tú"
      : item.senderType === "admin"
      ? `Administrador (${adminNamesMap[item.senderId] || "Desconocido"})`
      : "Usuario Desconocido";

    return (
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.otherMessage,
          item.senderType === "admin" && styles.adminMessage,
        ]}
      >
        {!isMyMessage && <Text style={styles.senderName}>{senderLabel}</Text>}
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp
            ? new Date(item.timestamp.toDate()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </Text>
      </View>
    );
  };

  if (loadingAdmins) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando administradores...</Text>
      </View>
    );
  }

  if (!selectedAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.listTitle}>Selecciona un Administrador para Chatear</Text>
        {admins.length === 0 ? (
          <Text style={styles.noAdminsText}>
            No hay administradores disponibles en este momento.
          </Text>
        ) : (
          <FlatList
            data={admins}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.adminItem}
                onPress={() => handleSelectAdmin(item)}
              >
                <Text style={styles.adminName}>{item.name || item.email}</Text>
                <Text style={styles.adminEmail}>{item.email}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.adminList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#007AFF"]} // azul para fondo claro
                tintColor="#007AFF"
              />
            }
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => {
            setSelectedAdmin(null);
            setKeyboardVisible(false);
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>&#x25C0; Volver</Text>
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle}>
          Chat con {selectedAdmin.name || selectedAdmin.email}
        </Text>
      </View>

      <KeyboardAvoidingView
        key={keyboardKey}
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 90 : 60}
      >
        <View style={{ flex: 1 }}>
          {loadingMessages ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Cargando mensajes...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.noMessagesContainer}>
              <Text style={styles.noMessagesText}>No hay mensajes aún. ¡Envía el primero!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              style={styles.flatListContentArea}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#fff"]} // blanco para fondo oscuro (header azul)
                  tintColor="#fff"
                />
              }
            />
          )}

          <View
            style={[
              styles.inputContainer,
              { paddingBottom: keyboardVisible ? 5 : 0 },
            ]}
          >
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escribe tu mensaje..."
              multiline
              blurOnSubmit={false}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#555" },
  listTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 25,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  adminList: { paddingHorizontal: 15, paddingBottom: 20 },
  adminItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderColor: "#E0E0E0",
    borderWidth: 1,
  },
  adminName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 3,
  },
  adminEmail: { fontSize: 15, color: "#666" },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: "#007AFF",
    elevation: 4,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 15,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  backButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  chatHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    flexShrink: 1,
    textAlign: "center",
    flex: 1,
  },
  flatListContentArea: { flex: 1, minHeight: 0 },
  messagesList: { paddingVertical: 10, paddingHorizontal: 15, flexGrow: 1 },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
    borderBottomRightRadius: 5,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 5,
  },
  adminMessage: { backgroundColor: "#E5E5EA", alignSelf: "flex-start" },
  senderName: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
    fontWeight: "bold",
  },
  messageText: { fontSize: 17, color: "#333", lineHeight: 22 },
  timestamp: {
    fontSize: 11,
    color: "#888",
    alignSelf: "flex-end",
    marginTop: 6,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 17,
    maxHeight: 120,
    minHeight: 40,
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  sendButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "bold" },
  noMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8F8F8",
  },
  noMessagesText: {
    fontSize: 19,
    color: "#888",
    textAlign: "center",
    lineHeight: 25,
  },
  noAdminsText: {
    fontSize: 17,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 30,
  },
});
