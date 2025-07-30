// App.js
"use client";
import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./src/config/Firebase/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

// Pantallas
import LoginScreen from "./src/pages/Login/LoginScreen";
import HomeScreen from "./src/pages/Home/HomeScreen";
import ProfileScreen from "./src/pages/Profile/ProfileScreen";
import RouteScreen from "./src/pages/Route/RouteScreen";
import CalendarScreen from "./src/pages/Calendar/CalendarScreen";
import ScanScreen from "./src/pages/Scan/ScanScreen";
import ReportsScreen from "./src/pages/Reports/ReportsScreen";
import IncidentsScreen from "./src/pages/Incidents/IncidentsScreen";
import InfoScreen from "./src/pages/Info/InfoScreen";
import ChatScreen from "./src/pages/Chat/ChatScreen";

const STATUS_PENDING = 0;
const STATUS_APPROVED = 1;
const STATUS_REJECTED = 2;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

function CustomHeader({ userName, navigation, title }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.log("Error al cerrar sesión:", e);
  }
};


  return (
    <LinearGradient
      colors={["#4A90E2", "#357ABD"]}
      style={styles.headerContainer}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>¡Hola!</Text>
          <Text style={styles.headerUserName}>{userName || "Usuario"}</Text>
          {title && <Text style={styles.headerTitle}>{title}</Text>}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setShowProfileMenu(!showProfileMenu)}
          >
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      {showProfileMenu && (
        <View style={styles.profileMenu}>
          <TouchableOpacity
            style={styles.profileMenuItem}
            onPress={() => {
              setShowProfileMenu(false);
              navigation.navigate("MoreTab", { screen: "Profile" });
            }}
          >
            <MaterialIcons name="person" size={20} color="#374151" />
            <Text style={styles.profileMenuText}>Mi Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileMenuItem}
            onPress={() => {
              setShowProfileMenu(false);
              navigation.navigate("MoreTab", { screen: "Info" });
            }}
          >
            <MaterialIcons name="info" size={20} color="#374151" />
            <Text style={styles.profileMenuText}>Información</Text>
          </TouchableOpacity>
          <View style={styles.profileMenuDivider} />
          <TouchableOpacity
            style={[styles.profileMenuItem, styles.signOutMenuItem]}
            onPress={() => {
              setShowProfileMenu(false);
              handleSignOut();
            }}
          >
            <MaterialIcons name="logout" size={20} color="#EF4444" />
            <Text style={[styles.profileMenuText, styles.signOutText]}>
              Cerrar Sesión
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

function MoreStackNavigator({ userName }) {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreHome" component={MoreScreen} />
      <MoreStack.Screen name="Reports" component={ReportsScreen} />
      <MoreStack.Screen name="Incidents" component={IncidentsScreen} />
      <MoreStack.Screen name="Chat" component={ChatScreen} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} />
      <MoreStack.Screen name="Info" component={InfoScreen} />
    </MoreStack.Navigator>
  );
}

function MainTabNavigator({ userName }) {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        header: () =>
          route.name === "HomeTab" ? (
            <CustomHeader userName={userName} navigation={navigation} />
          ) : null,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            HomeTab: "home",
            RouteTab: "map",
            CalendarTab: "calendar-today",
            ScanTab: "qr-code-scanner",
            MoreTab: "more-horiz",
          };
          const iconName = icons[route.name] || "circle";
          return (
            <View
              style={[
                styles.tabIconContainer,
                focused && styles.tabIconContainerActive,
              ]}
            >
              <MaterialIcons
                name={iconName}
                size={focused ? 28 : 24}
                color={color}
              />
              {focused && <View style={styles.tabIndicator} />}
            </View>
          );
        },
        tabBarActiveTintColor: "#4A90E2",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFF",
          borderTopWidth: 0,
          elevation: 20,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", marginTop: 4 },
        tabBarItemStyle: { paddingVertical: 5 },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: "Inicio" }}
      />
      <Tab.Screen
        name="RouteTab"
        component={RouteScreen}
        options={{ tabBarLabel: "Rutas" }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{ tabBarLabel: "Calendario" }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanScreen}
        options={{ tabBarLabel: "Escanear" }}
      />
      <Tab.Screen name="MoreTab">
        {(props) => <MoreStackNavigator {...props} userName={userName} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function MoreScreen({ navigation }) {
  const options = [
    {
      id: "reports",
      title: "Reportes",
      subtitle: "Crear y ver reportes",
      icon: "assessment",
      color: "#8B5CF6",
      screen: "Reports",
    },
    {
      id: "incidents",
      title: "Incidentes",
      subtitle: "Reportar problemas",
      icon: "report-problem",
      color: "#F59E0B",
      screen: "Incidents",
    },
    {
      id: "chat",
      title: "Chat Soporte",
      subtitle: "Contactar administrador",
      icon: "chat",
      color: "#10B981",
      screen: "Chat",
    },
    {
      id: "profile",
      title: "Mi Perfil",
      subtitle: "Configurar cuenta",
      icon: "person",
      color: "#06B6D4",
      screen: "Profile",
    },
    {
      id: "info",
      title: "Información",
      subtitle: "Guías y documentación",
      icon: "info",
      color: "#84CC16",
      screen: "Info",
    },
  ];

  return (
    <View style={styles.moreContainer}>
      <View style={styles.moreHeader}>
        <Text style={styles.moreTitle}>Opciones Adicionales</Text>
        <Text style={styles.moreSubtitle}>
          Accede a más funciones de la aplicación
        </Text>
      </View>
      <View style={styles.moreGrid}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={styles.moreOption}
            onPress={() => navigation.navigate(opt.screen)}
          >
            <View
              style={[styles.moreOptionIcon, { backgroundColor: opt.color }]}
            >
              <MaterialIcons name={opt.icon} size={28} color="#FFF" />
            </View>
            <View style={styles.moreOptionContent}>
              <Text style={styles.moreOptionTitle}>{opt.title}</Text>
              <Text style={styles.moreOptionSubtitle}>{opt.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvalCheckLoading, setApprovalCheckLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setApprovalCheckLoading(true);
      if (currentUser) {
        try {
          const docRef = doc(db, "usersApproval", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().status === STATUS_APPROVED) {
            setIsApproved(true);
            const { nombre, apellidoPaterno, apellidoMaterno } = docSnap.data();
            setUserName(
              [nombre, apellidoPaterno, apellidoMaterno]
                .filter(Boolean)
                .join(" ") || currentUser.email
            );
          } else {
            await signOut(auth);
            Alert.alert("Acceso Denegado", "Tu cuenta no está aprobada.");
          }
        } catch {
          await signOut(auth);
          Alert.alert("Error", "No se pudo verificar tu cuenta.");
        }
      }
      setApprovalCheckLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading || approvalCheckLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
        <LinearGradient
          colors={["#4A90E2", "#357ABD", "#2E5984"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContent}>
          <MaterialIcons
            name="local-shipping"
            size={100}
            color="#FFF"
            style={styles.logoGlow}
          />
          <Text style={styles.loadingTitle}>Trash & Track</Text>
          <Text style={styles.loadingSubtitle}>
            Sistema de Gestión de Residuos
          </Text>
          <ActivityIndicator
            size="large"
            color="#FFF"
            style={styles.loadingSpinner}
          />
          <Text style={styles.loadingText}>
            {loading ? "Verificando sesión..." : "Cargando..."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && isApproved ? (
          <Stack.Screen name="AppHome">
            {(props) => <MainTabNavigator {...props} userName={userName} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingContent: { alignItems: "center", padding: 40 },
  logoGlow: { position: "relative", marginBottom: 20 },
  loadingTitle: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  loadingSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    marginBottom: 40,
    textAlign: "center",
  },
  loadingSpinner: { marginBottom: 20 },
  loadingText: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    opacity: 0.9,
  },
  headerContainer: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flex: 1 },
  headerGreeting: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 2,
  },
  headerUserName: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  headerTitle: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  avatarButton: { padding: 4 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  profileMenu: {
    position: "absolute",
    top: 90,
    right: 20,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    minWidth: 180,
  },
  profileMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  profileMenuText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  signOutMenuItem: { backgroundColor: "#FEE2E2" },
  signOutText: { color: "#EF4444" },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabIconContainerActive: { transform: [{ scale: 1.1 }] },
  tabIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4A90E2",
    marginTop: 4,
  },
  moreContainer: { flex: 1, backgroundColor: "#F8FAFC", padding: 20 },
  moreHeader: { marginBottom: 30 },
  moreTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  moreSubtitle: { fontSize: 16, color: "#6B7280" },
  moreGrid: { flex: 1 },
  moreOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  moreOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  moreOptionContent: { flex: 1 },
  moreOptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  moreOptionSubtitle: { fontSize: 14, color: "#6B7280" },
});
