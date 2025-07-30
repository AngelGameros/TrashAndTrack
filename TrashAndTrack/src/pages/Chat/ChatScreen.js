"use client"

import { useState, useEffect, useRef } from "react"
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
  StatusBar,
} from "react-native"
import { auth, db } from "../../config/Firebase/firebaseConfig"
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

export default function ChatScreen() {
  const [admins, setAdmins] = useState([])
  const [adminNamesMap, setAdminNamesMap] = useState({})
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [keyboardKey, setKeyboardKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const flatListRef = useRef(null)

  const currentUser = auth.currentUser
  const userUID = currentUser?.uid

  const getChatRoomId = (uid1, uid2) => [uid1, uid2].sort().join("_")

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false)
      setKeyboardKey((prev) => prev + 1)
    })
    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  const fetchAdmins = () => {
    setLoadingAdmins(true)
    const q = query(collection(db, "usersApproval"), where("accountType", "==", "admin"))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const adminsList = []
        const namesMap = {}
        snapshot.docs.forEach((d) => {
          const adminData = d.data()
          const adminUid = d.id
          const fullName = [adminData.nombre, adminData.apellidoPaterno].filter(Boolean).join(" ")
          adminsList.push({ uid: adminUid, name: fullName, email: adminData.email })
          namesMap[adminUid] = fullName || adminData.email
        })
        setAdmins(adminsList)
        setAdminNamesMap(namesMap)
        setLoadingAdmins(false)
        setRefreshing(false)
      },
      (error) => {
        console.error("Error al cargar administradores:", error)
        Alert.alert("Error", "No se pudo cargar la lista de administradores.")
        setLoadingAdmins(false)
        setRefreshing(false)
      },
    )
    return unsubscribe
  }

  useEffect(() => {
    const unsubscribeAdmins = fetchAdmins()
    return () => unsubscribeAdmins && unsubscribeAdmins()
  }, [])

  useEffect(() => {
    let unsubscribe = null
    if (userUID && selectedAdmin) {
      setLoadingMessages(true)

      const chatRoomId = getChatRoomId(userUID, selectedAdmin.uid)
      const chatMessagesRef = collection(db, "privateChats", chatRoomId, "messages")
      const q = query(chatMessagesRef, orderBy("timestamp", "asc"))

      const userChatMetadataRef = doc(db, "chats", userUID)
      setDoc(
        userChatMetadataRef,
        {
          lastActive: serverTimestamp(),
          userEmail: currentUser?.email,
          userName: currentUser?.displayName || userUID,
          lastChatWithAdmin: selectedAdmin.uid,
        },
        { merge: true },
      ).catch((error) => console.error("Error al actualizar metadata del chat:", error))

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
          setMessages(msgs)
          setLoadingMessages(false)
          setRefreshing(false)
          if (flatListRef.current && msgs.length > 0) {
            setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100)
          }
        },
        (error) => {
          console.error("Error al obtener mensajes:", error)
          Alert.alert("Error", "No se pudieron cargar los mensajes de la conversación.")
          setLoadingMessages(false)
          setRefreshing(false)
        },
      )
    } else {
      setMessages([])
      setLoadingMessages(false)
      setRefreshing(false)
    }
    return () => unsubscribe && unsubscribe()
  }, [userUID, selectedAdmin])

  const onRefresh = () => {
    setRefreshing(true)
    if (!selectedAdmin) {
      fetchAdmins()
    } else {
      setSelectedAdmin(null)
      setTimeout(() => setSelectedAdmin((prev) => prev), 500)
      setRefreshing(false)
    }
  }

  const handleSelectAdmin = (admin) => {
    setSelectedAdmin(admin)
    setMessages([])
    setInputText("")
  }

  const sendMessage = async () => {
    if (inputText.trim() === "" || !userUID || !selectedAdmin) return
    try {
      const chatRoomId = getChatRoomId(userUID, selectedAdmin.uid)
      const chatMessagesRef = collection(db, "privateChats", chatRoomId, "messages")
      await addDoc(chatMessagesRef, {
        text: inputText,
        senderId: userUID,
        senderType: "user",
        timestamp: serverTimestamp(),
        recipientId: selectedAdmin.uid,
      })
      setInputText("")
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      Alert.alert("Error", "No se pudo enviar el mensaje.")
    }
  }

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === userUID
    const senderLabel = isMyMessage
      ? "Tú"
      : item.senderType === "admin"
        ? `${adminNamesMap[item.senderId] || "Administrador"}`
        : "Usuario Desconocido"

    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
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
    )
  }

  if (loadingAdmins) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
        <LinearGradient colors={["#4A90E2", "#357ABD"]} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Cargando administradores...</Text>
      </View>
    )
  }

  if (!selectedAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

        {/* Header */}
        <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.header}>
          <MaterialIcons name="support-agent" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Soporte Técnico</Text>
          <Text style={styles.headerSubtitle}>Selecciona un administrador para chatear</Text>
        </LinearGradient>

        {admins.length === 0 ? (
          <View style={styles.noAdminsContainer}>
            <MaterialIcons name="support-agent" size={80} color="#9CA3AF" />
            <Text style={styles.noAdminsTitle}>Sin Administradores</Text>
            <Text style={styles.noAdminsText}>No hay administradores disponibles en este momento.</Text>
          </View>
        ) : (
          <FlatList
            data={admins}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.adminItem} onPress={() => handleSelectAdmin(item)}>
                <View style={styles.adminAvatar}>
                  <MaterialIcons name="person" size={24} color="#4A90E2" />
                </View>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminName}>{item.name || item.email}</Text>
                  <Text style={styles.adminEmail}>{item.email}</Text>
                  <Text style={styles.adminStatus}>Disponible</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.adminList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4A90E2"]} tintColor="#4A90E2" />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Chat Header */}
      <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => {
            setSelectedAdmin(null)
            setKeyboardVisible(false)
          }}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderTitle}>{selectedAdmin.name || selectedAdmin.email}</Text>
          <Text style={styles.chatHeaderSubtitle}>Administrador • En línea</Text>
        </View>
        <View style={styles.chatHeaderActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <MaterialIcons name="more-vert" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        key={keyboardKey}
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 90 : 60}
      >
        <View style={{ flex: 1 }}>
          {loadingMessages ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={[styles.loadingText, { color: "#4A90E2" }]}>Cargando mensajes...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.noMessagesContainer}>
              <MaterialIcons name="chat-bubble-outline" size={80} color="#9CA3AF" />
              <Text style={styles.noMessagesTitle}>¡Inicia la conversación!</Text>
              <Text style={styles.noMessagesText}>
                Envía tu primer mensaje para comenzar a chatear con el administrador.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              style={styles.flatListContentArea}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#4A90E2"]}
                  tintColor="#4A90E2"
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Input Container */}
          <View style={[styles.inputContainer, { paddingBottom: keyboardVisible ? 5 : 20 }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Escribe tu mensaje..."
                placeholderTextColor="#9CA3AF"
                multiline
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
              >
                <MaterialIcons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  noAdminsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noAdminsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 20,
    marginBottom: 10,
  },
  noAdminsText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  adminList: {
    padding: 16,
  },
  adminItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  adminAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  adminStatus: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  chatHeaderSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  chatHeaderActions: {
    marginLeft: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  flatListContentArea: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4A90E2",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  senderName: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "600",
  },
  messageText: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    color: "#9CA3AF",
    alignSelf: "flex-end",
    marginTop: 6,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: "#4A90E2",
  },
  sendButtonInactive: {
    backgroundColor: "#9CA3AF",
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noMessagesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 20,
    marginBottom: 10,
  },
  noMessagesText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
})
